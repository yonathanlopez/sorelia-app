import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, Target, Brain, MessageCircle, ChevronRight, Sparkles, Bell, User, Heart, Star, Mail, Clock, RefreshCw, Flame } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import GmailScannerModal from '@/components/sorelia/GmailScannerModal';

const typeIcons = {
  important_date: Calendar,
  goal: Target,
  reminder: Bell,
  person: User,
  preference: Heart,
  life_event: Star,
};

const typeColors = {
  important_date: 'bg-violet-100 text-violet-600',
  goal: 'bg-emerald-100 text-emerald-600',
  reminder: 'bg-cyan-100 text-cyan-600',
  person: 'bg-blue-100 text-blue-600',
  preference: 'bg-rose-100 text-rose-600',
  life_event: 'bg-amber-100 text-amber-600',
};

const categories = [
  { type: 'person', label: 'People' },
  { type: 'goal', label: 'Goals' },
  { type: 'important_date', label: 'Important Dates' },
];

const quickQuestions = [
  "What do you remember about me?",
  "What goals did I mention?",
  "Who is important to me?",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(true);

  useEffect(() => {
    async function load() {
      const [me, mems] = await Promise.all([
        base44.auth.me(),
        base44.entities.Memory.list('-created_date', 50),
      ]);
      setUser(me);
      setMemories(mems);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await base44.functions.invoke('calendarScanner', {});
      const mems = await base44.entities.Memory.list('-created_date', 50);
      setMemories(mems);
    } catch {}
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const categoryCounts = Object.fromEntries(categories.map(c => [c.type, memories.filter(m => m.type === c.type).length]));

  // Calculate streak
  let streak = 0;
  if (memories.length > 0) {
    const sortedByDate = [...memories].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const uniqueDates = new Set(sortedByDate.map(m => m.created_date?.split('T')[0]));
    const dateArray = Array.from(uniqueDates).sort().reverse();
    
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const dateStr of dateArray) {
      const memoryDate = new Date(dateStr + 'T00:00:00');
      const daysDiff = Math.floor((currentDate - memoryDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Calculate upcoming events (birthdays, important dates, goals)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = memories
    .flatMap(m => {
      const events = [];
      // Add person's birthday
      if (m.type === 'person' && m.person_birthday) {
        events.push({
          id: `${m.id}-birthday`,
          title: `${m.title}'s Birthday`,
          date: m.person_birthday,
          type: 'person',
          original: m,
        });
      }
      // Add important dates
      if (m.type === 'important_date' && m.date) {
        events.push({
          id: m.id,
          title: m.title,
          date: m.date,
          type: 'important_date',
          original: m,
        });
      }
      // Add goals with due dates
      if (m.type === 'goal' && m.date && m.status !== 'completed') {
        events.push({
          id: m.id,
          title: m.title,
          date: m.date,
          type: 'goal',
          original: m,
        });
      }
      return events;
    })
    .map(ev => {
      const dateStr = ev.date;
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return { ...ev, eventDate };
      }
      return null;
    })
    .filter(ev => ev && ev.eventDate >= today)
    .sort((a, b) => a.eventDate - b.eventDate)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 px-6 pt-14 pb-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-violet-200 text-sm font-medium">{getGreeting()},</p>
            <h1 className="text-white text-3xl font-bold mt-0.5">{firstName}</h1>
          </div>
          {streak > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-2 border border-white/30">
              <Flame className="w-5 h-5 text-orange-300" />
              <div className="text-right">
                <p className="text-white font-bold text-lg">{streak}</p>
                <p className="text-white/80 text-[10px] font-semibold">day streak</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-violet-200 text-sm mt-1">Sorelia has {memories.length} memories about you</p>

        {/* CTA */}
        <Link
          to="/chat"
          className="mt-5 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Talk to Sorelia
        </Link>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-4 flex items-center gap-3 shadow-md text-left hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className={`w-5 h-5 text-white ${syncing ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{syncing ? 'Syncing...' : 'Sync Everything'}</p>
            <p className="text-white/80 text-xs mt-0.5">Pull in your calendar events, dates, and goals</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>

        {/* Gmail connect banner */}
        {!gmailConnected && (
          <button
            onClick={() => setShowGmailModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center gap-3 shadow-md text-left"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Connect Gmail</p>
              <p className="text-white/80 text-xs mt-0.5">Let Sorelia scan your inbox and build your life story</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70 flex-shrink-0" />
          </button>
        )}

        {/* Memory categories */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">What Sorelia knows</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(c => {
              const Icon = typeIcons[c.type];
              const color = typeColors[c.type];
              return (
                <Link
                  key={c.type}
                  to={`/memories?type=${c.type}`}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${color.split(' ')[0]} hover:opacity-80 transition-opacity`}
                >
                  <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
                  <p className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{c.label}</p>
                  <p className="text-[10px] text-gray-500">{categoryCounts[c.type]}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Coming up */}
        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Coming up</h2>
              <Link to="/calendar" className="text-xs text-violet-600 font-medium">Calendar</Link>
            </div>
            <div className="space-y-2.5">
              {upcomingEvents.map(ev => {
                const Icon = typeIcons[ev.type] || Clock;
                const color = typeColors[ev.type] || 'bg-gray-100 text-gray-600';
                const daysUntil = Math.ceil((ev.eventDate - today) / (1000 * 60 * 60 * 24));
                const dateStr = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`;
                return (
                  <div key={ev.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                      <p className="text-xs text-violet-500 font-medium">{dateStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ask Sorelia */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Ask Sorelia</h2>
          </div>
          <div className="space-y-2">
            {quickQuestions.map((q, i) => (
              <Link
                key={i}
                to={`/chat?q=${encodeURIComponent(q)}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition-colors group"
              >
                <p className="text-sm text-gray-600 group-hover:text-violet-700">"{q}"</p>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {memories.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-violet-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Start talking to Sorelia</h2>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
              Tell me about the people, dates, and goals that matter to you.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-violet-600 text-white rounded-full text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              Start chatting
            </Link>
          </div>
        )}
      </div>

      {showGmailModal && (
        <GmailScannerModal
          onClose={() => setShowGmailModal(false)}
          onComplete={() => {
            setShowGmailModal(false);
            setGmailConnected(true);
            base44.entities.Memory.list('-created_date', 50).then(setMemories);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}