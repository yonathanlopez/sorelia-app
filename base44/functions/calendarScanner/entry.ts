import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch events from now to 6 months ahead
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`,
      { headers: authHeader }
    );

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: 'Calendar API error: ' + err }, { status: 400 });
    }

    const data = await res.json();
    const events = data.items || [];

    // Save each event as a memory if it doesn't already exist (check by title+date)
    const existingMemories = await base44.asServiceRole.entities.Memory.filter({ source: 'google_calendar' });
    const existingKeys = new Set(existingMemories.map(m => `${m.title}||${m.date}`));

    let memoriesCreated = 0;
    for (const event of events) {
      const title = event.summary || '(no title)';
      const startDate = event.start?.dateTime || event.start?.date || '';
      const description = event.description || '';
      const location = event.location || '';

      // Determine memory type
      const lowerTitle = title.toLowerCase();
      let memType = 'important_date';
      if (lowerTitle.includes('birthday') || lowerTitle.includes('anniversary')) {
        memType = 'important_date';
      } else if (lowerTitle.includes('goal') || lowerTitle.includes('deadline') || lowerTitle.includes('due')) {
        memType = 'goal';
      } else if (lowerTitle.includes('reminder') || lowerTitle.includes('remind')) {
        memType = 'reminder';
      } else if (event.recurrence) {
        memType = 'reminder';
      }

      const key = `${title}||${startDate}`;
      if (!existingKeys.has(key)) {
        await base44.asServiceRole.entities.Memory.create({
          type: memType,
          title,
          description: [description, location ? `📍 ${location}` : ''].filter(Boolean).join('\n').slice(0, 500),
          date: startDate,
          people: [],
          source: 'google_calendar',
        });
        memoriesCreated++;
      }
    }

    return Response.json({
      events_fetched: events.length,
      memories_created: memoriesCreated,
      events: events.map(e => ({
        id: e.id,
        title: e.summary || '(no title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location || '',
        description: e.description || '',
        allDay: !!e.start?.date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});