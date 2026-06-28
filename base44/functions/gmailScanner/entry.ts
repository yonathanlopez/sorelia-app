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
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    let plain = '', html = '';
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) plain += decodeBase64(part.body.data);
      else if (part.mimeType === 'text/html' && part.body?.data) html += decodeBase64(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      else if (part.parts) plain += extractBodyText(part);
    }
    return (plain || html).slice(0, 3000);
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

    // Fetch full email content for first 20 emails
    const emailBatch = messageIds.slice(0, 20);
    const emailResults = await Promise.all(
      emailBatch.map(id =>
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: authHeader })
          .then(r => r.ok ? r.json() : null)
      )
    );

    // Build rich email summaries
    const emails = emailResults.filter(Boolean).map((msg, i) => {
      const headers = msg.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      const sender = headers.find(h => h.name === 'From')?.value || '';
      const body = extractBodyText(msg.payload);
      return { subject, date, sender, body: body.slice(0, 2000), index: i + 1 };
    });

    const emailSummaries = emails
      .map(e => `--- Email ${e.index} ---\nSubject: ${e.subject}\nFrom: ${e.sender}\nDate: ${e.date}\nBody:\n${e.body}`)
      .join('\n\n');

    // AI: extract memories AND per-email categorization details
    const extractPrompt = `You are analyzing someone's Gmail inbox. For each email, decide:
1. What category it falls into (Travel, Important Date, Life Event, Work/Career, Finance, Health, Purchase, Event, Personal, or Skip)
2. Why you categorized it that way
3. What specific memory types to extract from it (goal, important_date, preference, life_event, reminder) — or none if it should be skipped
4. What specific facts/entities were found (dates, places, events, purchases, appointments)
5. A confidence score 0-100 for how sure you are this contains something personally meaningful

Here are the emails:
${emailSummaries}

Return JSON with:
- email_classifications: array (one per email, in order) of:
  {
    email_index: number,
    subject: string,
    category_label: string (Travel/Important Date/Life Event/Work/Finance/Health/Purchase/Event/Personal/Skip),
    category_reasoning: string (1-2 sentences explaining WHY this category was chosen),
    memory_types_found: array of strings (e.g. ["important_date", "life_event"]) — empty if skipped,
    was_skipped: boolean,
    skip_reason: string (if skipped, why — e.g. "Promotional email with no personal relevance"),
    confidence_score: number 0-100,
    extracted_entities: string (comma-separated specific facts found: dates, places, events, people — or "none")
  }
- memories: array of { type, title, description, date } — the actual memories to save
- stats: { trips, birthdays, events, reminders, life_events }

Only extract memories that are genuinely personally meaningful. Max 30 memories.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: extractPrompt,
      model: 'gpt_5_5',
      response_json_schema: {
        type: 'object',
        properties: {
          email_classifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email_index: { type: 'number' },
                subject: { type: 'string' },
                category_label: { type: 'string' },
                category_reasoning: { type: 'string' },
                memory_types_found: { type: 'array', items: { type: 'string' } },
                was_skipped: { type: 'boolean' },
                skip_reason: { type: 'string' },
                confidence_score: { type: 'number' },
                extracted_entities: { type: 'string' },
              },
              required: ['email_index', 'category_label', 'was_skipped'],
            },
          },
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

    // Save memories
    let memoriesCreated = 0;
    if (result?.memories?.length > 0) {
      for (const mem of result.memories) {
        await base44.asServiceRole.entities.Calendar.create({
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