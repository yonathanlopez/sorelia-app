import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Calendar, Clock, ChevronRight, Plus, Target, User, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

const typeColors = {
  important_date: 'bg-violet-100 text-violet-600',
  goal: 'bg-emerald-100 text-emerald-600',
  person: 'bg-blue-100 text-blue-600',
};
const typeIcons = { important_date: Calendar, goal: Target, person: User };

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

function DaysBadge({ days }) {
  if (days === 0) return <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
  if (days === 1) return <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
  if (days <= 7) return <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">In {days} days</span>;
  return <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">In {days} days</span>;
}

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const mems = await base44.entities.Memory.list('-created_date', 200);
    setMemories(mems);
    setLoading(false);
    fetchCalendar();
  }

  async function fetchCalendar() {
    try {
      const res = await base44.functions.invoke('calendarScanner', {});
      if (res?.data?.events) setCalendarEvents(res.data.events);
    } catch { }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('calendarScanner', {});
      if (res?.data?.events) setCalendarEvents(res.data.events);
      const mems = await base44.entities.Memory.list('-created_date', 200);
      setMemories(mems);
    } catch { }
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reminders — goals with active status
  const reminders = memories.filter(m => m.type === 'goal' && m.status === 'active');

  // Coming up — important dates + person birthdays within next 90 days
  const upcomingEvents = memories
    .flatMap(m => {
      const events = [];
      if (m.type === 'important_date' && m.date) {
        events.push({ id: m.id, title: m.title, date: m.date, type: 'important_date', description: m.description });
      }
      if (m.type === 'person' && m.person_birthday) {
        const bday = m.person_birthday;
        const bdayThisYear = bday.replace(/^\d{4}/, new Date().getFullYear());
        events.push({ id: `${m.id}-bday`, title: `${m.title}'s Birthday`, date: bdayThisYear, type: 'person' });
      }
      return events;
    })
    .map(ev => ({ ...ev, daysUntil: getDaysUntil(ev.date) }))
    .filter(ev => ev.daysUntil >= 0 && ev.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Calendar events — from Google Calendar
  const upcomingCalendar = calendarEvents
    .filter(e => e.start || e.date)
    .map(e => ({ ...e, daysUntil: getDaysUntil((e.start || e.date).split('T')[0]) }))
    .filter(e => e.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 px-5 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Overview</h1>
            <p className="text-violet-200 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 text-white ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Reminders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Reminders</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{reminders.length}</span>
            </div>
            <Link to="/memories?type=goal" className="text-xs text-violet-600 font-medium">See all</Link>
          </div>

          {reminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No active reminders</p>
              <Link to="/" className="text-xs text-violet-500 font-medium mt-1 block">Ask Sorelia to set one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map(m => (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.title}</p>
                    {m.description && <p className="text-xs text-gray-400 truncate mt-0.5">{m.description}</p>}
                    {m.date && <p className="text-xs text-violet-500 font-medium mt-0.5">Due: {m.date}</p>}
                  </div>
                  {m.date && <DaysBadge days={getDaysUntil(m.date)} />}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Calendar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Calendar</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{upcomingCalendar.length}</span>
            </div>
            <Link to="/calendar" className="text-xs text-violet-600 font-medium">Full calendar</Link>
          </div>

          {upcomingCalendar.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No upcoming calendar events</p>
              <button onClick={handleSync} className="text-xs text-violet-500 font-medium mt-1 block mx-auto">Sync Google Calendar →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingCalendar.map((ev, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-12 flex-shrink-0 text-center">
                    <p className="text-lg font-bold text-violet-600 leading-none">
                      {new Date((ev.start || ev.date).split('T')[0] + 'T00:00:00').getDate()}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                      {new Date((ev.start || ev.date).split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ev.summary || ev.title}</p>
                    {ev.location && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.location}</p>}
                  </div>
                  <DaysBadge days={ev.daysUntil} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coming Up */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Coming Up</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{upcomingEvents.length}</span>
            </div>
            <Link to="/memories?type=important_date" className="text-xs text-violet-600 font-medium">See all</Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-400">No upcoming events saved</p>
              <Link to="/memories?type=important_date" className="text-xs text-violet-500 font-medium mt-1 block">Add important dates →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(ev => {
                const Icon = typeIcons[ev.type] || Clock;
                const color = typeColors[ev.type] || 'bg-gray-100 text-gray-500';
                return (
                  <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                      {ev.description && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <DaysBadge days={ev.daysUntil} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}