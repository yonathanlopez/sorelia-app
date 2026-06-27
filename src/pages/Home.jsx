import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, Target, Brain, MessageCircle, ChevronRight, Sparkles, Bell, User, Heart, Star } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const upcomingDates = memories.filter(m => m.type === 'important_date').slice(0, 3);
  const recentMemories = memories.slice(0, 3);
  const goals = memories.filter(m => m.type === 'goal').slice(0, 3);
  const reminders = memories.filter(m => m.type === 'reminder').slice(0, 3);

  const categoryCounts = {
    person: memories.filter(m => m.type === 'person').length,
    goal: memories.filter(m => m.type === 'goal').length,
    important_date: memories.filter(m => m.type === 'important_date').length,
    preference: memories.filter(m => m.type === 'preference').length,
    life_event: memories.filter(m => m.type === 'life_event').length,
    reminder: memories.filter(m => m.type === 'reminder').length,
  };

  const categories = [
    { type: 'person', label: 'People' },
    { type: 'goal', label: 'Goals' },
    { type: 'important_date', label: 'Important Dates' },
    { type: 'preference', label: 'Preferences' },
    { type: 'life_event', label: 'Life Events' },
    { type: 'reminder', label: 'Reminders' },
  ];

  const quickQuestions = [
    "What do you remember about me?",
    "What goals did I mention?",
    "Who is important to me?",
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-500 to-purple-600 px-6 pt-14 pb-8 rounded-b-3xl">
        <p className="text-violet-200 text-sm font-medium">{getGreeting()},</p>
        <h1 className="text-white text-2xl font-bold mt-0.5">{firstName}</h1>

        {/* Quick stats */}
        <div className="flex gap-3 mt-6">
          {reminders.length > 0 && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1">
              <p className="text-white/80 text-[10px] uppercase tracking-wider font-medium">Reminders</p>
              <p className="text-white text-xl font-bold mt-0.5">{reminders.length}</p>
            </div>
          )}
          {upcomingDates.length > 0 && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1">
              <p className="text-white/80 text-[10px] uppercase tracking-wider font-medium">Dates</p>
              <p className="text-white text-xl font-bold mt-0.5">{upcomingDates.length}</p>
            </div>
          )}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1">
            <p className="text-white/80 text-[10px] uppercase tracking-wider font-medium">Memories</p>
            <p className="text-white text-xl font-bold mt-0.5">{memories.length}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Upcoming dates */}
        {upcomingDates.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming</h2>
              <Link to="/memories" className="text-xs text-violet-600 font-medium">See all</Link>
            </div>
            <div className="space-y-2.5">
              {upcomingDates.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-violet-600">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent memories */}
        {recentMemories.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recent Memories</h2>
              <Link to="/memories" className="text-xs text-violet-600 font-medium">See all</Link>
            </div>
            <div className="space-y-2.5">
              {recentMemories.map(m => {
                const Icon = typeIcons[m.type] || Brain;
                const color = typeColors[m.type] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-500 truncate">{m.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Goals */}
        {goals.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Goals</h2>
              <Link to="/memories" className="text-xs text-violet-600 font-medium">See all</Link>
            </div>
            <div className="space-y-2.5">
              {goals.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">{m.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sorelia remembers — categories */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-900">Sorelia remembers</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(c => {
              const Icon = typeIcons[c.type];
              const color = typeColors[c.type];
              return (
                <Link
                  key={c.type}
                  to={`/memories?type=${c.type}`}
                  className={`flex items-center gap-2.5 p-3 rounded-xl hover:shadow-sm transition-all ${color.split(' ')[0]}`}
                >
                  <Icon className={`w-4 h-4 ${color.split(' ')[1]}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{c.label}</p>
                    <p className="text-[10px] text-gray-500">{categoryCounts[c.type]} saved</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Ask Sorelia */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
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
                <p className="text-sm text-gray-700 group-hover:text-violet-700">"{q}"</p>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600" />
              </Link>
            ))}
          </div>
        </section>

        {/* Empty state */}
        {memories.length === 0 && (
          <section className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Start talking to Sorelia</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              Tell me about the people, dates, and goals that matter to you. I'll remember everything.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-violet-600 text-white rounded-full text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Start chatting
            </Link>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}