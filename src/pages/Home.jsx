import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Calendar, Clock, RefreshCw, ChevronRight, X, Target, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

const typeColors = {
  important_date: 'bg-violet-100 text-violet-600',
  goal: 'bg-emerald-100 text-emerald-600',
  person: 'bg-blue-100 text-blue-600',
};
const typeIcons = { important_date: Calendar, goal: Target, person: User };

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

function DaysBadge({ days }) {
  if (days === null) return null;
  if (days === 0) return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">Today</span>;
  if (days === 1) return <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">Tomorrow</span>;
  if (days < 0) return <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">Passed</span>;
  return <span className="text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{days}d</span>;
}

function SectionModal({ title, icon: Icon, color, items, renderItem, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Nothing here yet</p>
        ) : (
          items.map((item, i) => renderItem(item, i))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState(null); // 'reminders' | 'calendar' | 'coming'

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
      const [res, mems] = await Promise.all([
        base44.functions.invoke('calendarScanner', {}),
        base44.entities.Memory.list('-created_date', 200),
      ]);
      if (res?.data?.events) setCalendarEvents(res.data.events);
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

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const reminders = memories.filter(m => m.type === 'goal' && m.status === 'active');

  const upcomingEvents = memories
    .flatMap(m => {
      const events = [];
      if (m.type === 'important_date' && m.date) events.push({ id: m.id, title: m.title, date: m.date, type: 'important_date', description: m.description });
      if (m.type === 'person' && m.person_birthday) {
        const bdayThisYear = m.person_birthday.replace(/^\d{4}/, new Date().getFullYear());
        events.push({ id: `${m.id}-bday`, title: `${m.title}'s Birthday`, date: bdayThisYear, type: 'person' });
      }
      return events;
    })
    .map(ev => ({ ...ev, daysUntil: getDaysUntil(ev.date) }))
    .filter(ev => ev.daysUntil >= 0 && ev.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingCalendar = calendarEvents
    .filter(e => e.start || e.date)
    .map(e => ({ ...e, daysUntil: getDaysUntil((e.start || e.date).split('T')[0]) }))
    .filter(e => e.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const renderReminderItem = (m, i) => (
    <div key={m.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{m.title}</p>
        {m.description && <p className="text-xs text-gray-400 truncate mt-0.5">{m.description}</p>}
      </div>
      {m.date && <DaysBadge days={getDaysUntil(m.date)} />}
    </div>
  );

  const renderCalendarItem = (ev, i) => {
    const dateStr = (ev.start || ev.date).split('T')[0];
    const d = new Date(dateStr + 'T00:00:00');
    return (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-12 text-center flex-shrink-0">
          <p className="text-xl font-bold text-violet-600 leading-none">{d.getDate()}</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
        </div>
        <div className="w-px h-10 bg-gray-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{ev.summary || ev.title}</p>
          {ev.location && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.location}</p>}
        </div>
        <DaysBadge days={ev.daysUntil} />
      </div>
    );
  };

  const renderComingItem = (ev, i) => {
    const Icon = typeIcons[ev.type] || Clock;
    const color = typeColors[ev.type] || 'bg-gray-100 text-gray-500';
    return (
      <div key={ev.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
        <DaysBadge days={ev.daysUntil} />
      </div>
    );
  };

  const sections = [
    {
      id: 'reminders',
      title: 'Reminders',
      icon: Bell,
      iconColor: 'bg-amber-100 text-amber-600',
      items: reminders,
      preview: reminders.slice(0, 2),
      renderItem: renderReminderItem,
      emptyText: 'No active reminders',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      iconColor: 'bg-violet-100 text-violet-600',
      items: upcomingCalendar,
      preview: upcomingCalendar.slice(0, 2),
      renderItem: renderCalendarItem,
      emptyText: 'No upcoming calendar events',
    },
    {
      id: 'coming',
      title: 'Coming Up',
      icon: Clock,
      iconColor: 'bg-rose-100 text-rose-500',
      items: upcomingEvents,
      preview: upcomingEvents.slice(0, 2),
      renderItem: renderComingItem,
      emptyText: 'No upcoming events',
    },
  ];

  const activeModal = sections.find(s => s.id === modal);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 px-5 pt-14 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Overview</h1>
            <p className="text-violet-200 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing} className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-white ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sections — evenly distributed */}
      <div className="flex-1 flex flex-col gap-3 px-4 py-4 pb-24 overflow-hidden">
        {sections.map(s => (
          <div key={s.id} className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-0">
            {/* Section header */}
            <button
              onClick={() => setModal(s.id)}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-50 flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconColor}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-gray-900">{s.title}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{s.items.length}</span>
              </div>
              <div className="flex items-center gap-1 text-violet-500">
                <span className="text-xs font-medium">See all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Preview items */}
            <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
              {s.preview.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-400">{s.emptyText}</p>
                </div>
              ) : (
                s.preview.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-1 py-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconColor}`}>
                      <s.icon className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-medium text-gray-800 flex-1 truncate">
                      {item.title || item.summary}
                    </p>
                    <DaysBadge days={item.daysUntil ?? (item.date ? getDaysUntil(item.date) : null)} />
                  </div>
                ))
              )}
              {s.items.length > 2 && (
                <button onClick={() => setModal(s.id)} className="w-full text-center text-[10px] text-violet-400 font-medium pt-0.5">
                  +{s.items.length - 2} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full-screen modal */}
      {modal && activeModal && (
        <SectionModal
          title={activeModal.title}
          icon={activeModal.icon}
          color={activeModal.iconColor}
          items={activeModal.items}
          renderItem={activeModal.renderItem}
          onClose={() => setModal(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}