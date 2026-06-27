import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONNECTOR_ID = '6a3f1d5883dab3778fd3485c';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch up to 100 recent emails
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=in:inbox',
      { headers: authHeader }
    );
    if (!listRes.ok) {
      const err = await listRes.text();
      return Response.json({ error: 'Gmail API error: ' + err }, { status: 400 });
    }
    const listData = await listRes.json();
    const messageIds = (listData.messages || []).map(m => m.id);

    if (messageIds.length === 0) {
      return Response.json({ memories_created: 0, stats: { contacts: 0, trips: 0, birthdays: 0, events: 0, flights: 0 } });
    }

    // Fetch first 30 emails in parallel (full metadata)
    const emailBatch = messageIds.slice(0, 30);
    const emailPromises = emailBatch.map(id =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: authHeader })
        .then(r => r.ok ? r.json() : null)
    );
    const emailResults = await Promise.all(emailPromises);

    // Build summary text for AI
    const emailSummaries = emailResults
      .filter(Boolean)
      .map(msg => {
        const headers = msg.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        return `From: ${from} | Subject: ${subject} | Date: ${date}`;
      })
      .join('\n');

    // AI extraction
    const extractPrompt = `You are analyzing someone's Gmail inbox to extract meaningful life memories. 
    
Here are their recent emails:
${emailSummaries}

Extract meaningful memories from these emails. Focus on:
- People they interact with regularly (contacts, friends, family, colleagues)
- Trips and travel (flight confirmations, hotel bookings, travel plans)
- Birthdays and special dates mentioned
- Upcoming events, appointments, or plans
- Subscriptions, interests, preferences revealed by newsletters/shopping
- Life events (job changes, moves, purchases, etc.)

Return JSON with:
- memories: array of { type (person/goal/important_date/preference/life_event/reminder), title, description, date (if applicable), people (array of names) }
- stats: { contacts: number, trips: number, birthdays: number, events: number, flights: number }

Only extract clear, specific facts. Max 40 memories.`;

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
                people: { type: 'array', items: { type: 'string' } },
              },
              required: ['type', 'title'],
            },
          },
          stats: {
            type: 'object',
            properties: {
              contacts: { type: 'number' },
              trips: { type: 'number' },
              birthdays: { type: 'number' },
              events: { type: 'number' },
              flights: { type: 'number' },
            },
          },
        },
      },
    });

    // Save memories to DB
    let memoriesCreated = 0;
    if (result?.memories?.length > 0) {
      for (const mem of result.memories) {
        await base44.asServiceRole.entities.Memory.create({
          type: mem.type,
          title: mem.title,
          description: mem.description || '',
          date: mem.date || '',
          people: mem.people || [],
          source: 'gmail',
        });
        memoriesCreated++;
      }
    }

    return Response.json({
      memories_created: memoriesCreated,
      stats: result?.stats || { contacts: 0, trips: 0, birthdays: 0, events: 0, flights: 0 },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});