import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Fetch all calendars the user has access to
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
      { headers: authHeader }
    );
    if (!calListRes.ok) {
      const err = await calListRes.text();
      return Response.json({ error: 'Calendar list error: ' + err }, { status: 400 });
    }
    const calListData = await calListRes.json();
    const calendars = calListData.items || [];

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from ALL calendars
    const allEvents = [];
    for (const cal of calendars) {
      const calId = encodeURIComponent(cal.id);
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?maxResults=100&orderBy=startTime&singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`,
        { headers: authHeader }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.items || []).map(e => ({ ...e, calendarName: cal.summary }));
      allEvents.push(...items);
    }

    // Deduplicate by event id
    const seen = new Set();
    const uniqueEvents = allEvents.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Save each event as a memory if it doesn't already exist
    const existingMemories = await base44.asServiceRole.entities.Memory.filter({ source: 'google_calendar' });
    const existingKeys = new Set(existingMemories.map(m => `${m.title}||${m.date}`));

    let memoriesCreated = 0;
    for (const event of uniqueEvents) {
      const title = event.summary || '(no title)';
      const startDate = event.start?.dateTime || event.start?.date || '';
      const description = event.description || '';
      const location = event.location || '';

      const lowerTitle = title.toLowerCase();
      let memType = 'important_date';
      if (lowerTitle.includes('goal') || lowerTitle.includes('deadline') || lowerTitle.includes('due')) {
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
          description: [description, location ? `📍 ${location}` : '', event.calendarName ? `📅 ${event.calendarName}` : ''].filter(Boolean).join('\n').slice(0, 500),
          date: startDate,
          people: [],
          source: 'google_calendar',
        });
        memoriesCreated++;
      }
    }

    return Response.json({
      events_fetched: uniqueEvents.length,
      calendars_scanned: calendars.length,
      memories_created: memoriesCreated,
      events: uniqueEvents.map(e => ({
        id: e.id,
        title: e.summary || '(no title)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location || '',
        description: e.description || '',
        calendarName: e.calendarName || '',
        allDay: !!e.start?.date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});