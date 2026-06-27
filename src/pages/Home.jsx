import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle, Clock, Lightbulb, Sparkles, Plus } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import GmailScannerModal from '@/components/sorelia/GmailScannerModal';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  return diff;
}

function formatCountdown(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1 && days <= 30) return `In ${days} days`;
  if (days > 30) return `In ${Math.round(days/30)} months`;
  return null;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGmailModal, setShowGmailModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [me, mems] = await Promise.all([
        base44.auth.me(),
        base44.entities.Memory.list('-created_date', 100),
      ]);
      setUser(me);
      setMemories(mems);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Upcoming: memories with dates in future
  const upcoming = memories
    .filter(m => m.date && m.type !== 'preference' && m.type !== 'life_event')
    .map(m => ({ ...m, days: daysUntil(m.date) }))
    .filter(m => m.days !== null && m.days >= 0 && m.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  // Reminders
  const reminders = memories
    .filter(m => m.type === 'reminder')
    .slice(0, 3);

  // Recent memories (last 5)
  const recent = memories.slice(0, 5);

  // Suggestions (static smart ones based on data)
  const suggestions = [];
  const people = memories.filter(m => m.type === 'person');
  if (people.length > 0) suggestions.push(`Check in with ${people[0].title}`);
  const goals = memories.filter(m => m.type === 'goal');
  if (goals.length > 0) suggestions.push(`Review your goal: ${goals[0].title}`);
  if (suggestions.length < 2) suggestions.push('Connect Gmail to let Sorelia learn from your inbox');

  const typeEmoji = {
    person: '👤', goal: '🎯', important_date: '📅',
    preference: '💜', life_event: '🌟', reminder: '🔔',
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-6 border-b border-gray-100">
        <p className="text-[13px] text-gray-400 font-medium">{getGreeting()}</p>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mt-0.5">{firstName}</h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Sorelia remembers {memories.length} things about your life.
        </p>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* Talk to Sorelia CTA */}
        <Link
          to="/chat"
          className="flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Ask Sorelia anything</p>
            <p className="text-white/60 text-xs mt-0.5">About your life, goals, people…</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </Link>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-900">Upcoming</span>
              </div>
              <Link to="/memories" className="text-[12px] text-violet-600 font-medium">See all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {upcoming.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base">{typeEmoji[m.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{m.title}</p>
                    {m.description && <p className="text-[11px] text-gray-400 truncate">{m.description}</p>}
                  </div>
                  <span className={`text-[11px] font-semibold flex-shrink-0 ${m.days <= 7 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formatCountdown(m.days)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-[13px] font-semibold text-gray-900">Suggestions</span>
            </div>
            <div className="divide-y divide-gray-50 pb-1">
              {suggestions.map((s, i) => (
                <Link key={i} to="/chat" className="flex items-center gap-3 px-4 py-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-[13px] text-gray-700 flex-1">{s}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Memories */}
        {recent.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-[13px] font-semibold text-gray-900">Recently Remembered</span>
              </div>
              <Link to="/memories" className="text-[12px] text-violet-600 font-medium">All</Link>
            </div>
            <div className="divide-y divide-gray-50 pb-1">
              {recent.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-base">{typeEmoji[m.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">{m.title}</p>
                    {m.description && <p className="text-[11px] text-gray-400 truncate">{m.description}</p>}
                  </div>
                  {m.source && (
                    <span className="text-[10px] text-gray-300 flex-shrink-0 capitalize">{m.source}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {memories.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7 text-gray-400" />
            </div>
            <h2 className="text-[17px] font-bold text-gray-900">Your life, organized.</h2>
            <p className="text-[13px] text-gray-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Tell Sorelia about the people, dates, and things that matter to you. She'll remember everything.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 text-white rounded-full text-[13px] font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              Start talking
            </Link>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowGmailModal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showGmailModal && (
        <GmailScannerModal
          onClose={() => setShowGmailModal(false)}
          onComplete={() => {
            setShowGmailModal(false);
            base44.entities.Memory.list('-created_date', 100).then(setMemories);
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}