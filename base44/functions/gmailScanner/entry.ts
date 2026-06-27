import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a3f1d5883dab3778fd3485c';

function decodeBase64(encoded) {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    return decodeURIComponent(escape(binary));
  } catch {
    return '';
  }
}

function extractBodyText(payload) {
  if (!payload) return '';

  // Direct body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Multipart — prefer text/plain, fallback to text/html
  if (payload.parts) {
    let plainText = '';
    let htmlText = '';
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plainText += decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlText += decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } else if (part.parts) {
        // nested multipart
        plainText += extractBodyText(part);
      }
    }
    return (plainText || htmlText).slice(0, 3000);
  }

  return '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch up to 50 recent emails
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox',
      { headers: authHeader }
    );
    if (!listRes.ok) {
      const err = await listRes.text();
      return Response.json({ error: 'Gmail API error: ' + err }, { status: 400 });
    }
    const listData = await listRes.json();
    const messageIds = (listData.messages || []).map(m => m.id);

    if (messageIds.length === 0) {
      return Response.json({ memories_created: 0, stats: { trips: 0, birthdays: 0, events: 0, reminders: 0, life_events: 0 } });
    }

    // Fetch full email content (body + headers) for first 20 emails
    const emailBatch = messageIds.slice(0, 20);
    const emailPromises = emailBatch.map(id =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: authHeader })
        .then(r => r.ok ? r.json() : null)
    );
    const emailResults = await Promise.all(emailPromises);

    // Build rich email summaries with full body content
    const emailSummaries = emailResults
      .filter(Boolean)
      .map((msg, i) => {
        const headers = msg.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const body = extractBodyText(msg.payload);
        return `--- Email ${i + 1} ---\nSubject: ${subject}\nDate: ${date}\nBody:\n${body.slice(0, 2000)}`;
      })
      .join('\n\n');

    // Deep AI extraction based on full email content
    const extractPrompt = `You are analyzing someone's Gmail inbox to extract meaningful life memories. Read each email carefully and extract real, specific facts from the actual email content — not just from who sent it.

Here are their recent emails with full content:
${emailSummaries}

Extract meaningful memories. Focus ONLY on:
- Important dates mentioned IN the email body (appointments, deadlines, events, birthdays, anniversaries, reservations, travel dates, etc.)
- Travel plans and trips (hotel bookings, flight confirmations, car rentals, itineraries)
- Upcoming events and appointments (doctor visits, meetings, concerts, weddings, etc.)
- Life events (job offers, purchases, moves, graduations, milestones)
- Reminders and action items (renewals, deadlines, follow-ups)
- Personal goals or interests revealed by subscriptions or purchases

DO NOT extract:
- Generic contact/sender information
- Marketing emails with no specific personal relevance
- Vague or unclear information

For dates: extract the actual date mentioned IN the email content (e.g. "Your reservation is for July 15, 2026"), not the date the email was received.

Return JSON:
- memories: array of { type (goal/important_date/preference/life_event/reminder), title (specific and descriptive), description (what the email actually said), date (the real date mentioned, e.g. "July 15, 2026") }
- stats: { trips: number, birthdays: number, events: number, reminders: number, life_events: number }

Max 30 memories. Only extract clear, specific, personally relevant facts.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: extractPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          memories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string' },
              },
              required: ['type', 'title'],
            },
          },
          stats: {
            type: 'object',
            properties: {
              trips: { type: 'number' },
              birthdays: { type: 'number' },
              events: { type: 'number' },
              reminders: { type: 'number' },
              life_events: { type: 'number' },
            },
          },
        },
      },
    });

    // Save scanned emails log
    for (const msg of emailResults.filter(Boolean).slice(0, 20)) {
      const headers = msg.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const sender = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const body = extractBodyText(msg.payload).slice(0, 300);
      await base44.asServiceRole.entities.ScannedEmail.create({
        subject,
        sender,
        date,
        body_preview: body,
        memories_extracted: 0,
      });
    }

    // Save memories
    let memoriesCreated = 0;
    if (result?.memories?.length > 0) {
      for (const mem of result.memories) {
        await base44.asServiceRole.entities.Memory.create({
          type: mem.type,
          title: mem.title,
          description: mem.description || '',
          date: mem.date || '',
          people: [],
          source: 'gmail',
        });
        memoriesCreated++;
      }
    }

    return Response.json({
      memories_created: memoriesCreated,
      stats: result?.stats || { trips: 0, birthdays: 0, events: 0, reminders: 0, life_events: 0 },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});