'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMemories } from '@/hooks/useMemories';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CALENDAR_COLORS = [
  '#7C3AED','#06B6D4','#10B981','#F59E0B','#EF4444',
  '#EC4899','#8B5CF6','#14B8A6','#F97316','#6366F1',
  '#84CC16','#0EA5E9',
];

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
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedCalendars, setSelectedCalendars] = useState(new Set(['all']));
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const { data: memories = [], isPending } = useMemories();
  const loading = isPending && memories.length === 0;

  const events = useMemo(() => {
    const calRes = null;

    const people = memories.filter((m) => m.type === 'person' && m.person_birthday);
    const birthdayEvents = people.map((p) => ({
      id: `${p.id}-birthday`,
      type: 'person',
      title: `🎂 ${p.title}'s Birthday`,
      description: p.description,
      date: p.person_birthday,
      original_id: p.id,
    }));

    const gcalLive = (calRes?.data?.events || []).map((e) => ({
      id: `gcal-${e.id || Math.random()}`,
      type: 'gcal',
      title: e.summary || e.title || 'Untitled',
      description: e.description || e.location || null,
      date: (e.start || e.date || '').split('T')[0],
      time: (e.start || '').includes('T') ? e.start : null,
    }));
    const liveKeys = new Set(gcalLive.map((e) => e.date + '||' + e.title));

    const gcalSaved = memories
      .filter((m) => m.source === 'google_calendar' && m.date)
      .map((m) => ({
        id: m.id,
        type: 'gcal',
        title: m.title,
        description: m.description || null,
        date: m.date.split('T')[0],
        time: m.date.includes('T') ? m.date : null,
        calendarName: m.calendar_name || null,
      }))
      .filter((e) => !liveKeys.has(e.date + '||' + e.title));

    const otherMemories = memories
      .filter((m) => m.source !== 'google_calendar' && m.type !== 'person' && m.date)
      .map((m) => ({ ...m, type: m.type }));

    return [...otherMemories, ...birthdayEvents, ...gcalLive, ...gcalSaved];
  }, [memories]);

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

  // Derive unique calendar names from events
  const calendarNames = ['all', ...Array.from(new Set(events.map(e => e.calendarName).filter(Boolean)))];
  const calendarColorMap = {};
  calendarNames.filter(c => c !== 'all').forEach((name, i) => {
    calendarColorMap[name] = CALENDAR_COLORS[i % CALENDAR_COLORS.length];
  });

  // Filter events by selected calendars
  const filteredEvents = selectedCalendars.has('all')
    ? events
    : events.filter(e => !e.calendarName || selectedCalendars.has(e.calendarName));

  function toggleCalendar(name) {
    if (name === 'all') {
      setSelectedCalendars(new Set(['all']));
      return;
    }
    setSelectedCalendars(prev => {
      const next = new Set(prev);
      next.delete('all');
      if (next.has(name)) {
        next.delete(name);
        if (next.size === 0) next.add('all');
      } else {
        next.add(name);
      }
      return next;
    });
  }

  // Map events to days in current month/year
  const eventsByDay = {};
  for (const ev of filteredEvents) {
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowCalendarPicker(p => !p)}
                className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-2 rounded-full"
              >
                <span className="flex gap-0.5 items-center">
                  {selectedCalendars.has('all')
                    ? <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
                    : Array.from(selectedCalendars).slice(0, 3).map(name => (
                        <span key={name} className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: calendarColorMap[name] || '#7C3AED' }} />
                      ))
                  }
                </span>
                {selectedCalendars.has('all') ? 'All calendars' : `${selectedCalendars.size} selected`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showCalendarPicker ? 'rotate-90' : 'rotate-0'}`} />
              </button>

              {/* Dropdown */}
              {showCalendarPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCalendarPicker(false)} />
                  <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[220px] py-2 overflow-hidden">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2">Calendars</p>
                    {/* All option */}
                    <button
                      onClick={() => toggleCalendar('all')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedCalendars.has('all') ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0" />
                      <span className={`font-medium ${selectedCalendars.has('all') ? 'text-violet-700' : 'text-gray-700'}`}>All calendars</span>
                      {selectedCalendars.has('all') && <span className="ml-auto text-violet-500 text-xs">✓</span>}
                    </button>
                    {/* Individual calendars */}
                    {calendarNames.filter(c => c !== 'all').map(name => (
                      <button
                        key={name}
                        onClick={() => toggleCalendar(name)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedCalendars.has(name) ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: calendarColorMap[name] }} />
                        <span className={`font-medium truncate text-left flex-1 ${selectedCalendars.has(name) ? 'text-violet-700' : 'text-gray-700'}`}>{name}</span>
                        {selectedCalendars.has(name) && <span className="ml-auto text-violet-500 text-xs flex-shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
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
                <EventCard key={ev.id} event={ev} calendarColorMap={calendarColorMap} />
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
                <Link href="/" className="text-sm text-violet-500 font-semibold">Ask Sorelia about your schedule →</Link>
              </div>
            ) : (
              Object.entries(eventsByDay)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, evs]) => (
                  <div key={day}>
                    <p className="text-xs text-gray-400 font-semibold mb-1.5">{MONTHS[currentMonth]} {day}</p>
                    {evs.map(ev => <EventCard key={ev.id} event={ev} calendarColorMap={calendarColorMap} />)}
                  </div>
                ))
            )}
          </>
        )}
      </div>

    </div>
  );
}

function EventCard({ event, calendarColorMap = {} }) {
  const calColor = event.calendarName && calendarColorMap[event.calendarName];
  const dot = typeColors[event.type] || 'bg-violet-500';
  const d = parseEventDate(event.date);
  const timeStr = event.time
    ? new Date(event.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : (d && !event.date?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null);

  return (
    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-start gap-3">
      <div
        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${calColor ? '' : dot}`}
        style={calColor ? { background: calColor } : {}}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
        {timeStr && (
          <p className="text-xs text-violet-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />{timeStr}
          </p>
        )}
        {event.calendarName && (
          <p className="text-[9px] text-gray-400 mt-0.5">{event.calendarName}</p>
        )}
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}