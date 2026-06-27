import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Calendar, Clock, RefreshCw, ChevronRight, X, Target, User, CreditCard, Cake, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import BottomNav from '@/components/BottomNav';
import SoreliaFAB from '@/components/SoreliaFAB';

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
  if (days === 0) return <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">Today</span>;
  if (days === 1) return <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">Tomorrow</span>;
  if (days < 0) return <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">Passed</span>;
  return <span className="text-[9px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{days}d</span>;
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
  const [modal, setModal] = useState(null); // 'reminders' | 'calendar' | 'coming' | 'today'
  const [showAllToday, setShowAllToday] = useState(false);

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
      // Bills, birthdays, and anniversaries only
      if (m.type === 'important_date' && m.date && ['bills', 'birthday', 'anniversary'].includes(m.date_type)) {
        events.push({ id: m.id, title: m.title, date: m.date, type: 'important_date', description: m.description, date_type: m.date_type });
      }
      // Birthdays from people
      if (m.type === 'person' && m.person_birthday) {
        const bdayThisYear = m.person_birthday.replace(/^\d{4}/, new Date().getFullYear());
        events.push({ id: `${m.id}-bday`, title: `🎂 ${m.title}'s Birthday`, date: bdayThisYear, type: 'person' });
      }
      // Anniversaries from people
      if (m.type === 'person' && m.person_anniversary) {
        const annivThisYear = m.person_anniversary.replace(/^\d{4}/, new Date().getFullYear());
        events.push({ id: `${m.id}-anniv`, title: `💍 ${m.title}'s Anniversary`, date: annivThisYear, type: 'person' });
      }
      return events;
    })
    .map(ev => ({ ...ev, daysUntil: getDaysUntil(ev.date) }))
    .filter(ev => ev.daysUntil >= 0 && ev.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Use saved Google Calendar memories (source: 'google_calendar') + live API events merged
  const gcalMemories = memories
    .filter(m => m.source === 'google_calendar' && m.date)
    .map(m => ({ id: m.id, title: m.title, start: m.date, date: m.date, location: m.description }));

  const liveEvents = calendarEvents.filter(e => e.start || e.date);
  const liveKeys = new Set(liveEvents.map(e => (e.start || e.date).split('T')[0] + '||' + (e.title || e.summary)));
  const mergedCalendar = [
    ...liveEvents,
    ...gcalMemories.filter(m => !liveKeys.has(m.date.split('T')[0] + '||' + m.title)),
  ];

  const upcomingCalendar = mergedCalendar
    .map(e => ({ ...e, daysUntil: getDaysUntil((e.start || e.date).split('T')[0]) }))
    .filter(e => e.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const renderReminderItem = (m, i) => {
    const daysUntil = m.date ? getDaysUntil(m.date) : null;
    let dateDisplay = null;
    if (daysUntil !== null) {
      if (daysUntil === 0) {
        dateDisplay = <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
      } else if (daysUntil === 1) {
        dateDisplay = <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
      } else if (daysUntil > 1) {
        dateDisplay = <span className="text-[9px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{daysUntil}d</span>;
      }
    }
    return (
      <div key={m.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{m.title}</p>
          {m.description && <p className="text-sm text-gray-400 truncate mt-0.5">{m.description}</p>}
        </div>
        {dateDisplay}
      </div>
    );
  };

  const renderCalendarItem = (ev, i) => {
    const rawDate = ev.start || ev.date || '';
    const dateStr = rawDate.split('T')[0];
    const d = new Date(dateStr + 'T00:00:00');
    const hasTime = rawDate.includes('T');
    const timeStr = hasTime
      ? new Date(rawDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null;
    const daysUntil = getDaysUntil(dateStr);
    
    let dateDisplay = null;
    if (daysUntil === 0) {
      dateDisplay = <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
    } else if (daysUntil === 1) {
      dateDisplay = <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
    } else {
      dateDisplay = <div className="w-10 flex flex-col items-center"><span className="text-xs font-semibold text-gray-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span><span className="text-xl font-bold text-violet-600 leading-tight">{d.getDate()}</span></div>;
    }
    
    return (
      <div key={i} className="flex items-stretch gap-3 px-1 py-1.5">
        <div className="w-0.5 rounded-full bg-violet-200 flex-shrink-0 my-1" />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-base font-semibold text-gray-900 truncate">{ev.summary || ev.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {timeStr && (
              <span className="text-sm font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">{timeStr}</span>
            )}
            {ev.location && <span className="text-sm text-gray-400 truncate">📍 {ev.location}</span>}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 pt-0.5">
          {dateDisplay}
        </div>
      </div>
    );
  };

  const renderComingItem = (ev, i) => {
    let Icon, color;
    if (ev.date_type === 'bills') {
      Icon = CreditCard;
      color = 'bg-blue-100 text-blue-600';
    } else if (ev.date_type === 'birthday' || ev.type === 'person' && ev.id.endsWith('-bday')) {
      Icon = Cake;
      color = 'bg-rose-100 text-rose-500';
    } else if (ev.date_type === 'anniversary' || ev.type === 'person' && ev.id.endsWith('-anniv')) {
      Icon = Heart;
      color = 'bg-pink-100 text-pink-500';
    } else {
      Icon = Calendar;
      color = 'bg-gray-100 text-gray-500';
    }
    let dateDisplay = null;
    if (ev.daysUntil === 0) {
      dateDisplay = <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
    } else if (ev.daysUntil === 1) {
      dateDisplay = <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
    } else {
      dateDisplay = <span className="text-[9px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{ev.daysUntil}d</span>;
    }
    return (
      <div key={ev.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{ev.title}</p>
        </div>
        {dateDisplay}
      </div>
    );
  };

  const todayItems = [
    ...memories.filter(m => m.type === 'important_date' && m.date && getDaysUntil(m.date) === 0)
      .map(m => ({ label: m.title, emoji: '📅' })),
    ...memories.filter(m => m.type === 'goal' && m.status === 'active' && m.date && getDaysUntil(m.date) === 0)
      .map(m => ({ label: m.title, emoji: '🎯' })),
    ...memories.filter(m => m.type === 'person' && m.person_birthday && getDaysUntil(m.person_birthday.replace(/^\d{4}/, new Date().getFullYear())) === 0)
      .map(m => ({ label: `${m.title}'s Birthday`, emoji: '🎂' })),
    ...memories.filter(m => m.type === 'person' && m.person_anniversary && getDaysUntil(m.person_anniversary.replace(/^\d{4}/, new Date().getFullYear())) === 0)
      .map(m => ({ label: `${m.title}'s Anniversary`, emoji: '💍' })),
    ...upcomingCalendar.filter(e => e.daysUntil === 0)
      .map(e => ({ label: e.title || e.summary, emoji: '📆' })),
  ];

  const sections = [
    {
      id: 'reminders',
      title: 'Reminders',
      icon: Bell,
      iconColor: 'bg-amber-100 text-amber-600',
      items: reminders,
      preview: reminders.slice(0, 4),
      renderItem: renderReminderItem,
      emptyText: 'No active reminders — tell Sorelia to add one!',
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      iconColor: 'bg-violet-100 text-violet-600',
      items: upcomingCalendar,
      preview: upcomingCalendar.slice(0, 4),
      renderItem: renderCalendarItem,
      emptyText: 'No calendar events — ask Sorelia to check your schedule!',
    },
    {
      id: 'coming',
      title: 'Recurring',
      icon: Clock,
      iconColor: 'bg-rose-100 text-rose-500',
      items: upcomingEvents,
      preview: upcomingEvents.slice(0, 4),
      renderItem: renderComingItem,
      emptyText: 'No recurring events — tell Sorelia about birthdays, bills & more!',
    },
  ];

  const activeModal = sections.find(s => s.id === modal);

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Today's Summary */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <h2 className="text-sm font-bold text-gray-900">Today's Summary</h2>
              {todayItems.length > 0 && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{todayItems.length}</span>}
            </div>
            {todayItems.length > 4 && (
              <button onClick={() => setShowAllToday(!showAllToday)} className="text-xs text-violet-500 font-medium flex items-center gap-0.5">
                {showAllToday ? 'Show less' : `See all`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAllToday ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
          {todayItems.length === 0 ? (
            <p className="text-xs text-gray-400">Nothing special today — enjoy the calm! 🌿</p>
          ) : (
            <div className="space-y-1.5">
              {(showAllToday ? todayItems : todayItems.slice(0, 4)).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                </div>
              ))}
              {!showAllToday && todayItems.length > 4 && (
                <button onClick={() => setShowAllToday(true)} className="text-[10px] text-violet-400 font-medium pt-0.5">
                  +{todayItems.length - 4} more
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3 px-4 py-4 pb-28">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setModal(s.id)}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow"
          >
            {/* Section header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.iconColor}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-gray-900">{s.title}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{s.items.length}</span>
              </div>
            </div>

            {/* Preview items */}
            <div className="px-3 py-2 space-y-0.5">
              {s.preview.length === 0 ? (
                <Link to="/" className="block text-xs text-violet-500 font-medium text-center py-3 hover:text-violet-700">{s.emptyText}</Link>
              ) : (
                s.id === 'calendar'
                  ? s.preview.map((item, i) => {
                      const rawDate = item.start || item.date || '';
                      const dateStr = rawDate.split('T')[0];
                      const d = new Date(dateStr + 'T00:00:00');
                      const hasTime = rawDate.includes('T');
                      const timeStr = hasTime
                        ? new Date(rawDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        : null;
                      const daysUntil = getDaysUntil(dateStr);
                      
                      let dateDisplay = null;
                      if (daysUntil === 0) {
                        dateDisplay = <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
                      } else if (daysUntil === 1) {
                        dateDisplay = <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
                      } else {
                        dateDisplay = <div className="w-9 text-center"><p className="text-[9px] font-semibold text-gray-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p><p className="text-base font-bold text-violet-600 leading-tight">{d.getDate()}</p></div>;
                      }
                      
                      return (
                        <div key={i} className="flex items-center gap-2.5 px-1 py-1.5">
                          <div className="w-0.5 h-7 rounded-full bg-violet-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{item.title || item.summary}</p>
                            {timeStr && <span className="text-[10px] text-violet-400 font-medium">{timeStr}</span>}
                          </div>
                          {dateDisplay}
                        </div>
                      );
                    })
                  : s.preview.map((item, i) => {
                      let Icon, color;
                      if (item.date_type === 'bills') {
                        Icon = CreditCard;
                        color = 'bg-blue-100 text-blue-600';
                      } else if (item.date_type === 'birthday' || item.type === 'person' && item.id?.endsWith('-bday')) {
                        Icon = Cake;
                        color = 'bg-rose-100 text-rose-500';
                      } else if (item.date_type === 'anniversary' || item.type === 'person' && item.id?.endsWith('-anniv')) {
                        Icon = Heart;
                        color = 'bg-pink-100 text-pink-500';
                      } else {
                        Icon = s.icon;
                        color = s.iconColor;
                      }
                      return (
                        <div key={i} className="flex items-center gap-2 px-1 py-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <p className="text-xs font-medium text-gray-800 flex-1 truncate">
                            {item.title || item.summary}
                          </p>
                          <DaysBadge days={item.daysUntil ?? (item.date ? getDaysUntil(item.date) : null)} />
                        </div>
                      );
                    })
              )}
              {s.items.length > 4 && (
                <div className="w-full text-center text-[10px] text-violet-400 font-medium py-1">
                  +{s.items.length - 4} more
                </div>
              )}
            </div>
          </button>
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