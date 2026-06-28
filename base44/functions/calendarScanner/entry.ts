import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function getGoogleAccessToken(base44) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    if (accessToken) return accessToken;
  } catch {
    // Fall through to app-user connector if configured.
  }

  const connectorId = Deno.env.get('GOOGLE_CALENDAR_CONNECTOR_ID');
  if (connectorId) {
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    if (accessToken) return accessToken;
  }

  throw new Error(
    'Google Calendar is not connected. Connect Google Calendar in your Base44 app integrations, then try again.',
  );
}

function buildDescription(event) {
  const title = event.summary || '(no title)';
  const description = event.description || '';
  const location = event.location || '';
  const calName = event.calendarName || '';
  return [description, location ? `📍 ${location}` : '', calName ? `📅 ${calName}` : '']
    .filter(Boolean)
    .join('\n')
    .slice(0, 500);
}

function inferMemoryType(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('goal') || lowerTitle.includes('deadline') || lowerTitle.includes('due')) {
    return 'goal';
  }
  return 'important_date';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await getGoogleAccessToken(base44);
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50&minAccessRole=reader',
      { headers: authHeader },
    );

    if (!calListRes.ok) {
      const err = await calListRes.text();
      return Response.json(
        { error: 'Could not read Google Calendar list. Reconnect Google Calendar and try again.', detail: err },
        { status: 400 },
      );
    }

    const calListData = await calListRes.json();
    const calendars = calListData.items || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeMin = today.toISOString();
    const timeMax = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const allEvents = [];

    for (const cal of calendars) {
      try {
        const calId = encodeURIComponent(cal.id);
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?maxResults=100&orderBy=startTime&singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`,
          { headers: authHeader },
        );
        if (!res.ok) continue;
        const data = await res.json();
        const items = (data.items || [])
          .filter((e) => e.status !== 'cancelled')
          .map((e) => ({ ...e, calendarName: cal.summary || cal.id }));
        allEvents.push(...items);
        await sleep(150);
      } catch {
        continue;
      }
    }

    const seen = new Set();
    const uniqueEvents = allEvents.filter((e) => {
      if (!e.id || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    const existingMemories = await base44.entities.Calendar.filter({ source: 'google_calendar' });
    const existingByEventId = new Map(
      existingMemories.filter((m) => m.google_event_id).map((m) => [m.google_event_id, m]),
    );
    const existingKeys = new Set(existingMemories.map((m) => `${m.title}||${m.date || m.start_time}`));

    let memoriesCreated = 0;
    let memoriesUpdated = 0;

    for (const event of uniqueEvents) {
      const title = event.summary || '(no title)';
      const startDate = event.start?.dateTime || event.start?.date || '';
      const endDate = event.end?.dateTime || event.end?.date || '';
      const allDay = !!event.start?.date;
      const memType = inferMemoryType(title);
      const payload = {
        type: memType,
        title,
        description: buildDescription(event),
        date: startDate,
        start_time: startDate,
        end_time: endDate,
        all_day: allDay,
        location: event.location || '',
        calendar_name: event.calendarName || '',
        source: 'google_calendar',
        google_event_id: event.id,
        people: [],
        status: 'active',
      };

      const existing = existingByEventId.get(event.id);
      if (existing) {
        await base44.entities.Calendar.update(existing.id, payload);
        memoriesUpdated++;
        continue;
      }

      const fallbackKey = `${title}||${startDate}`;
      if (existingKeys.has(fallbackKey)) continue;

      await base44.entities.Calendar.create(payload);
      memoriesCreated++;
      existingKeys.add(fallbackKey);
    }

    return Response.json({
      events_fetched: uniqueEvents.length,
      calendars_scanned: calendars.length,
      memories_created: memoriesCreated,
      memories_updated: memoriesUpdated,
      events: uniqueEvents.map((e) => ({
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
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});
