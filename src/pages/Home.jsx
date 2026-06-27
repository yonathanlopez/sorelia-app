import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, RefreshCw, ChevronRight, X, Target, User, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import BottomNav from '@/components/BottomNav';
import SoreliaFAB from '@/components/SoreliaFAB';
import PreviewCardItem from '@/components/PreviewCardItem';

const typeColors = {
  important_date: 'bg-violet-100 text-violet-600',
  goal: 'bg-emerald-100 text-emerald-600',
  person: 'bg-blue-100 text-blue-600'
};
const typeIcons = { important_date: Calendar, goal: Target, person: User };

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();today.setHours(0, 0, 0, 0);
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
        {items.length === 0 ?
        <p className="text-sm text-gray-400 text-center py-10">Nothing here yet</p> :

        items.map((item, i) => renderItem(item, i))
        }
      </div>
    </div>);

}

export default function Home() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState(null); // 'reminders' | 'calendar' | 'coming' | 'today'
  const [user, setUser] = useState(null);
  const [completedToday, setCompletedToday] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    load();
  }, []);

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
    } catch {}
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const [res, mems] = await Promise.all([
      base44.functions.invoke('calendarScanner', {}),
      base44.entities.Memory.list('-created_date', 200)]
      );
      if (res?.data?.events) setCalendarEvents(res.data.events);
      setMemories(mems);
    } catch {}
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>);

  }

  const today = new Date();today.setHours(0, 0, 0, 0);

  const reminders = memories.
  filter((m) => m.type === 'goal' && m.status === 'active').
  map((m, i) => {
    const times = ['09:00', '14:30', '18:00', '11:00'];
    return m.date && m.date.length === 10 ?
    { ...m, date: m.date + 'T' + times[i % times.length] + ':00' } :
    m;
  });

  const upcomingEvents = memories.
  flatMap((m) => {
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
  }).
  map((ev) => ({ ...ev, daysUntil: getDaysUntil(ev.date) })).
  filter((ev) => ev.daysUntil >= 0 && ev.daysUntil <= 90).
  sort((a, b) => a.daysUntil - b.daysUntil);

  // Use saved Google Calendar memories (source: 'google_calendar') + live API events merged
  const gcalMemories = memories.
  filter((m) => m.source === 'google_calendar' && m.date).
  map((m) => ({ id: m.id, title: m.title, start: m.date, date: m.date, location: m.description }));

  const liveEvents = calendarEvents.filter((e) => e.start || e.date);
  const liveKeys = new Set(liveEvents.map((e) => (e.start || e.date).split('T')[0] + '||' + (e.title || e.summary)));
  const mergedCalendar = [
  ...liveEvents,
  ...gcalMemories.filter((m) => !liveKeys.has(m.date.split('T')[0] + '||' + m.title))];


  const upcomingCalendar = mergedCalendar.
  map((e) => ({ ...e, daysUntil: getDaysUntil((e.start || e.date).split('T')[0]) })).
  filter((e) => e.daysUntil >= 0).
  sort((a, b) => a.daysUntil - b.daysUntil);

  const renderReminderItem = (m, i) => {
    const daysUntil = m.date ? getDaysUntil(m.date) : null;
    const hasTime = m.date && m.date.includes('T');
    const timeStr = hasTime ?
    new Date(m.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) :
    null;

    let dateDisplay = null;
    if (daysUntil === 0) {
      dateDisplay = <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
    } else if (daysUntil === 1) {
      dateDisplay = <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
    } else if (daysUntil !== null && daysUntil > 1) {
      dateDisplay = <span className="text-[9px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{daysUntil}d</span>;
    }

    return (
      <div key={i} className="flex items-stretch gap-3 px-1 py-1.5">
        <div className="w-0.5 rounded-full bg-amber-200 flex-shrink-0 my-1" />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-base font-semibold text-gray-900 truncate">{m.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {timeStr &&
            <span className="text-sm font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">{timeStr}</span>
            }
            {m.description && <span className="text-sm text-gray-400 truncate">{m.description}</span>}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 pt-0.5">
          {dateDisplay}
        </div>
      </div>);

  };

  const renderCalendarItem = (ev, i) => {
    const rawDate = ev.start || ev.date || '';
    const dateStr = rawDate.split('T')[0];
    const d = new Date(dateStr + 'T00:00:00');
    const hasTime = rawDate.includes('T');
    const timeStr = hasTime ?
    new Date(rawDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) :
    null;
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
            {timeStr &&
            <span className="text-sm font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">{timeStr}</span>
            }
            {ev.location && <span className="text-sm text-gray-400 truncate">📍 {ev.location}</span>}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 pt-0.5">
          {dateDisplay}
        </div>
      </div>);

  };

  const renderComingItem = (ev, i) => {
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
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{ev.title}</p>
        </div>
        {dateDisplay}
      </div>);

  };

  async function handleDone(id, isMemory = true) {
    const isCurrentlyCompleted = completedToday.has(id);

    // Update UI state first
    if (isCurrentlyCompleted) {
      setCompletedToday((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setCompletedToday((prev) => new Set([...prev, id]));
    }

    // Then update database if it's a memory
    if (isMemory) {
      try {
        const memoryId = id.includes('-') ? id.split('-')[0] : id;
        const newStatus = isCurrentlyCompleted ? 'active' : 'completed';
        await base44.entities.Memory.update(memoryId, { status: newStatus });
        const mems = await base44.entities.Memory.list('-created_date', 200);
        setMemories(mems);
      } catch (err) {
        // If update fails, revert the UI state
        setCompletedToday((prev) => {
          const reverted = new Set(prev);
          if (isCurrentlyCompleted) {
            reverted.add(id);
          } else {
            reverted.delete(id);
          }
          return reverted;
        });
      }
    }
  }

  const todayItems = [
  ...memories.filter((m) => m.type === 'important_date' && m.date && getDaysUntil(m.date) === 0).
  map((m) => ({
    title: m.title,
    id: m.id,
    source: 'recurring',
    onDone: () => handleDone(m.id)
  })),
  ...reminders.filter((m) => getDaysUntil(m.date) === 0).
  map((m) => ({
    title: m.title,
    id: m.id,
    source: 'reminders',
    time: m.date && m.date.includes('T') ? new Date(m.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null,
    onDone: () => handleDone(m.id)
  })),
  ...memories.filter((m) => m.type === 'person' && m.person_birthday && getDaysUntil(m.person_birthday.replace(/^\d{4}/, new Date().getFullYear())) === 0).
  map((m) => {
    const itemId = `${m.id}-bday`;
    return {
      title: `${m.title}'s Birthday`,
      id: itemId,
      source: 'recurring',
      onDone: () => handleDone(itemId)
    };
  }),
  ...memories.filter((m) => m.type === 'person' && m.person_anniversary && getDaysUntil(m.person_anniversary.replace(/^\d{4}/, new Date().getFullYear())) === 0).
  map((m) => {
    const itemId = `${m.id}-anniv`;
    return {
      title: `${m.title}'s Anniversary`,
      id: itemId,
      source: 'recurring',
      onDone: () => handleDone(itemId)
    };
  }),
  ...upcomingCalendar.filter((e) => e.daysUntil === 0).
  map((e) => ({
    title: e.title || e.summary,
    id: e.id,
    source: 'calendar',
    time: (e.start || e.date).includes('T') ? new Date(e.start || e.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null,
    onDone: () => handleDone(e.id, false)
  }))];


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
    quickChips: ["Remind me about...", "Create a task"]
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
    quickChips: ["Schedule this for me", "What's on my calendar?"]
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
    quickChips: ["Remember this birthday", "Track this bill"]
  }];


  const activeModal = sections.find((s) => s.id === modal);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Today's Summary */}
      <div className="px-2 py-2 rounded">
        <button className="w-full bg-white rounded-xl border border-gray-100 shadow-md text-left hover:shadow-lg transition-all text-sm">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">
              <Bell className="w-3 h-3" />
            </div>
            <span className="text-sm font-semibold text-gray-900 flex-1">Today's Summary</span>
          </div>
          <div className="px-2 py-2 space-y-0">
            {todayItems.length === 0 ?
            <div className="text-center py-3">
                <p className="text-xs text-gray-400">Nothing special today</p>
              </div> :

            todayItems.map((item, i) =>
            <PreviewCardItem key={i} item={item} type="today" getDaysUntil={getDaysUntil} isCompleted={completedToday.has(item.id)} />
            )
            }
          </div>
        </button>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-2 px-2 py-2 pb-28">
        {sections.map((s) =>
        <button
          key={s.id}
          onClick={() => setModal(s.id)}
          className="w-full bg-white rounded-xl border border-gray-100 shadow-md text-left hover:shadow-lg transition-all">
          
            {/* Section header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-50">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconColor}`}>
                <s.icon className="w-3 h-3" />
              </div>
              <span className="text-sm font-semibold text-gray-900 flex-1">{s.title}</span>
            </div>

            {/* Preview items */}
            <div className="space-y-0 px-1.5 py-5">
              {s.preview.length === 0 ?
            <div className="text-center py-3">
                  <button
                onClick={() => {
                  const actions = {
                    reminders: 'Add a reminder for me',
                    calendar: 'Check my calendar',
                    coming: 'Remember a birthday for me'
                  };
                  navigate('/', { state: { prefill: `Sorelia, ${actions[s.id] || s.quickChips[0]}` } });
                }}
                className="text-xs text-violet-500 font-medium mb-2 hover:text-violet-600 active:scale-95 transition-all">
                
                    {s.emptyText}
                  </button>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {s.quickChips.slice(0, 2).map((chip) =>
                <button
                  key={chip}
                  onClick={() => navigate('/', { state: { prefill: `Sorelia, ${chip}` } })}
                  className="text-[9px] bg-white/40 text-gray-700 font-medium px-2.5 py-1.5 rounded-xl border border-white/30 backdrop-blur-sm hover:bg-white/60 active:scale-95 transition-all">
                  
                        {chip}
                      </button>
                )}
                  </div>
                </div> :

            s.preview.map((item, i) =>
            <PreviewCardItem key={i} item={item} type={s.id === 'calendar' ? 'calendar' : s.id} getDaysUntil={getDaysUntil} />
            )
            }
            </div>
          </button>
        )}
      </div>

      {/* Full-screen modal */}
      {modal && activeModal &&
      <SectionModal
        title={activeModal.title}
        icon={activeModal.icon}
        color={activeModal.iconColor}
        items={activeModal.items}
        renderItem={activeModal.renderItem}
        onClose={() => setModal(null)} />

      }

      <BottomNav />
    </div>);

}