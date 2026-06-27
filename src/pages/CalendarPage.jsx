import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import SoreliaFAB from '@/components/SoreliaFAB';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const typeColors = {
  important_date: 'bg-violet-500',
  goal: 'bg-emerald-500',
  reminder: 'bg-cyan-500',
  person: 'bg-blue-500',
  preference: 'bg-pink-500',
  life_event: 'bg-amber-500',
  gcal: 'bg-sky-500',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function parseEventDate(dateStr) {
  if (!dateStr) return null;
  // Handle YYYY-MM-DD format (birthdays)
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    const d = new Date(year, parseInt(month) - 1, parseInt(day));
    if (!isNaN(d)) return d;
  }
  // Fall back to Date constructor
  const d = new Date(dateStr);
  if (!isNaN(d)) return d;
  return null;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    // Load saved memories instantly
    const memories = await base44.entities.Memory.list('-date', 500);
    const calRes = null;
    
    // Add people's birthdays as events
    const people = memories.filter(m => m.type === 'person' && m.person_birthday);
    const birthdayEvents = people.map(p => ({
      id: `${p.id}-birthday`,
      type: 'person',
      title: `🎂 ${p.title}'s Birthday`,
      description: p.description,
      date: p.person_birthday,
      original_id: p.id,
    }));

    // Live Google Calendar events from API
    const gcalLive = (calRes?.data?.events || []).map(e => ({
      id: `gcal-${e.id || Math.random()}`,
      type: 'gcal',
      title: e.summary || e.title || 'Untitled',
      description: e.description || e.location || null,
      date: (e.start || e.date || '').split('T')[0],
      time: (e.start || '').includes('T') ? e.start : null,
    }));
    const liveKeys = new Set(gcalLive.map(e => e.date + '||' + e.title));

    // Saved Google Calendar memories — use as fallback when live API doesn't return them
    const gcalSaved = memories
      .filter(m => m.source === 'google_calendar' && m.date)
      .map(m => ({
        id: m.id,
        type: 'gcal',
        title: m.title,
        description: m.description || null,
        date: m.date.split('T')[0],
        time: m.date.includes('T') ? m.date : null,
      }))
      .filter(e => !liveKeys.has(e.date + '||' + e.title));

    // Non-gcal memories with dates (person memories handled separately via birthdayEvents)
    const otherMemories = memories
      .filter(m => m.source !== 'google_calendar' && m.type !== 'person' && m.date)
      .map(m => ({ ...m, type: m.type }));

    const allEvents = [
      ...otherMemories,
      ...birthdayEvents,
      ...gcalLive,
      ...gcalSaved,
    ];
    
    setEvents(allEvents);
    setLoading(false);
  }

  async function syncCalendar() {
    setSyncing(true);
    try {
      const [memories, calRes] = await Promise.all([
        base44.entities.Memory.list('-date', 500),
        base44.functions.invoke('calendarScanner', {}).catch(() => null),
      ]);

      const people = memories.filter(m => m.type === 'person' && m.person_birthday);
      const birthdayEvents = people.map(p => ({
        id: `${p.id}-birthday`, type: 'person',
        title: `🎂 ${p.title}'s Birthday`, description: p.description,
        date: p.person_birthday, original_id: p.id,
      }));
      const gcalLive = (calRes?.data?.events || []).map(e => ({
        id: `gcal-${e.id || Math.random()}`, type: 'gcal',
        title: e.summary || e.title || 'Untitled',
        description: e.description || e.location || null,
        date: (e.start || e.date || '').split('T')[0],
        time: (e.start || '').includes('T') ? e.start : null,
      }));
      const liveKeys = new Set(gcalLive.map(e => e.date + '||' + e.title));
      const gcalSaved = memories
        .filter(m => m.source === 'google_calendar' && m.date)
        .map(m => ({ id: m.id, type: 'gcal', title: m.title, description: m.description || null, date: m.date.split('T')[0], time: m.date.includes('T') ? m.date : null }))
        .filter(e => !liveKeys.has(e.date + '||' + e.title));
      const otherMemories = memories.filter(m => m.source !== 'google_calendar' && m.type !== 'person' && m.date).map(m => ({ ...m, type: m.type }));
      setEvents([...otherMemories, ...birthdayEvents, ...gcalLive, ...gcalSaved]);
    } catch {}
    setSyncing(false);
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  }

  // Map events to days in current month/year
  const eventsByDay = {};
  for (const ev of events) {
    const d = parseEventDate(ev.date);
    if (!d) continue;
    
    // Birthdays: match any year by month+day only
    const matchMonth = ev.type === 'person' && ev.original_id
      ? d.getMonth() === currentMonth
      : d.getFullYear() === currentYear && d.getMonth() === currentMonth;

    if (matchMonth) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  }

  // Sort events within each day by time (earliest first)
  for (const day of Object.keys(eventsByDay)) {
    eventsByDay[day].sort((a, b) => {
      const timeA = a.time || a.date || '';
      const timeB = b.time || b.date || '';
      return timeA.localeCompare(timeB);
    });
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];
  const isToday = (day) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
          <button
            onClick={syncCalendar}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-600 px-3 py-2 rounded-full disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-900">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mt-4 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const hasEvents = eventsByDay[day]?.length > 0;
              const selected = day === selectedDay;
              const todayCell = isToday(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`relative flex flex-col items-center justify-center h-10 rounded-xl transition-colors
                    ${selected ? 'bg-violet-600 text-white' : todayCell ? 'bg-violet-100 text-violet-700 font-bold' : 'hover:bg-gray-100 text-gray-800'}`}
                >
                  <span className="text-sm font-medium">{day}</span>
                  {hasEvents && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selected ? 'bg-white' : 'bg-violet-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {selectedDay ? (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {MONTHS[currentMonth]} {selectedDay}
            </p>
            {selectedEvents.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">No events on this day.</div>
            ) : (
              selectedEvents.map(ev => (
                <EventCard key={ev.id} event={ev} />
              ))
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">This month</p>
            {Object.keys(eventsByDay).length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-violet-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">No events this month.</p>
                <Link to="/" className="text-sm text-violet-500 font-semibold">Ask Sorelia about your schedule →</Link>
              </div>
            ) : (
              Object.entries(eventsByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, evs]) => (
                  <div key={day}>
                    <p className="text-xs text-gray-400 font-semibold mb-1.5">{MONTHS[currentMonth]} {day}</p>
                    {evs.map(ev => <EventCard key={ev.id} event={ev} />)}
                  </div>
                ))
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function EventCard({ event }) {
  const dot = typeColors[event.type] || 'bg-violet-500';
  const d = parseEventDate(event.date);
  const timeStr = event.time
    ? new Date(event.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : (d && !event.date?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null);

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
        {timeStr && (
          <p className="text-xs text-violet-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />{timeStr}
          </p>
        )}
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}