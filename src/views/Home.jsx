'use client';

import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { MEMORIES_QUERY_KEY, useMemories } from '@/hooks/useMemories';
import {
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Gift,
  MessageCircle,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

function formatEventDate(dateStr, daysUntil) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (!dateStr) return '';
  return new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function SectionCard({ icon: Icon, iconClass, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatPill({ icon: Icon, label, value, tone }) {
  const tones = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tones[tone]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [completedToday, setCompletedToday] = useState(new Set());

  const { data: memories = [], isPending: memoriesLoading } = useMemories();
  const loading = memoriesLoading && memories.length === 0;

  const userName = String(user?.full_name ?? '').split(' ')[0] || 'there';
  const greeting = getGreeting();
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const stats = useMemo(() => {
    const goals = memories.filter((m) => m.type === 'goal');
    const activeGoals = goals.filter((m) => m.status !== 'completed').length;
    const completedGoals = goals.filter((m) => m.status === 'completed').length;
    const upcomingCount = memories
      .filter((m) => m.date)
      .map((m) => getDaysUntil(m.date?.split('T')[0]))
      .filter((d) => d !== null && d > 0 && d <= 30).length;

    return { activeGoals, completedGoals, upcomingCount, totalGoals: goals.length };
  }, [memories]);

  const todayTasks = useMemo(() => {
    return memories
      .filter((m) => getDaysUntil(m.date?.split('T')[0]) === 0)
      .map((m) => ({
        id: m.id,
        title: m.title,
        completed: m.status === 'completed',
        time:
          m.date && m.date.includes('T')
            ? new Date(m.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : null,
      }))
      .sort((a, b) => {
        const timeA = a.time ? new Date(`2000-01-01 ${a.time}`).getTime() : Infinity;
        const timeB = b.time ? new Date(`2000-01-01 ${b.time}`).getTime() : Infinity;
        return timeA - timeB;
      });
  }, [memories]);

  const upcomingEvents = useMemo(() => {
    return memories
      .filter((m) => m.date)
      .map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        type: m.type,
        daysUntil: getDaysUntil(m.date?.split('T')[0]),
      }))
      .filter((ev) => ev.daysUntil > 0 && ev.daysUntil <= 90)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [memories]);

  const upcomingCal = upcomingEvents.slice(0, 4);
  const importantEvents = upcomingEvents.slice(0, 5);
  const goalProgress = stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0;

  async function handleDone(id, isCurrentlyCompleted) {
    const newStatus = isCurrentlyCompleted ? 'active' : 'completed';

    setCompletedToday((prev) => {
      const next = new Set(prev);
      if (isCurrentlyCompleted) next.delete(id);
      else next.add(id);
      return next;
    });

    queryClient.setQueryData(MEMORIES_QUERY_KEY, (old = []) =>
      old.map((m) => (m.id === id ? { ...m, status: newStatus } : m)),
    );

    try {
      await base44.entities.Calendar.update(id, { status: newStatus });
    } catch {
      queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-28 bg-gray-50">
        <div className="h-40 bg-gradient-to-br from-violet-600 to-purple-700 animate-pulse" />
        <div className="px-4 -mt-8 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 hide-scrollbar bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 px-5 pt-12 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-violet-200 text-sm font-medium">{todayLabel}</p>
            <h1 className="text-white text-2xl font-bold mt-1 leading-tight">
              {greeting.text}, {userName} {greeting.emoji}
            </h1>
            <p className="text-violet-100 text-sm mt-1.5">Here&apos;s what&apos;s ahead today.</p>
          </div>
          <Link
            href="/chat"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
            aria-label="Open chat"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </Link>
        </div>

        {stats.totalGoals > 0 && (
          <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/15">
            <div className="flex items-center justify-between text-sm text-white mb-2">
              <span className="font-medium">Goal progress</span>
              <span className="text-violet-100">{goalProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 -mt-5 grid grid-cols-3 gap-2">
        <StatPill icon={Target} label="Active" value={stats.activeGoals} tone="violet" />
        <StatPill icon={CheckCircle} label="Done" value={stats.completedGoals} tone="emerald" />
        <StatPill icon={Calendar} label="Upcoming" value={stats.upcomingCount} tone="blue" />
      </div>

      <div className="px-4 mt-4 space-y-3">
        {/* Today */}
        <SectionCard
          icon={Clock}
          iconClass="bg-violet-100 text-violet-600"
          title="Today"
          action={
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          }
        >
          <div className="divide-y divide-gray-50">
            {todayTasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Nothing scheduled today</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">Ask Sorelia to add a task or reminder</p>
                <button
                  onClick={() => router.push('/chat')}
                  className="text-xs font-semibold text-violet-600 bg-violet-50 px-4 py-2 rounded-full hover:bg-violet-100 transition-colors"
                >
                  Add with Sorelia
                </button>
              </div>
            ) : (
              todayTasks.map((task) => {
                const done = task.completed || completedToday.has(task.id);
                return (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="text-xs font-medium text-gray-400 w-14 shrink-0">
                      {task.time || 'All day'}
                    </span>
                    <span className={`flex-1 text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleDone(task.id, done)}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 scale-100'
                          : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        {/* Upcoming */}
        <button type="button" onClick={() => router.push('/calendar')} className="w-full text-left group">
          <SectionCard
            icon={Calendar}
            iconClass="bg-blue-100 text-blue-600"
            title="Upcoming"
            action={
              <span className="flex items-center gap-0.5 text-xs font-medium text-violet-600 group-hover:text-violet-700">
                Calendar
                <ChevronRight className="w-4 h-4" />
              </span>
            }
          >
            <div className="px-4 py-3">
              {upcomingCal.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">No upcoming events in the next 90 days</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/chat');
                    }}
                    className="text-xs text-violet-600 font-medium mt-2 hover:underline"
                  >
                    Ask Sorelia to add dates
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingCal.map((event, idx) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 py-2.5 rounded-xl group-hover:bg-gray-50 transition-colors px-1 -mx-1"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            idx === 0 ? 'bg-violet-600 ring-4 ring-violet-100' : 'bg-gray-300'
                          }`}
                        />
                        {idx < upcomingCal.length - 1 && <div className="w-px h-5 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {event.daysUntil === 1 ? 'Tomorrow' : `In ${event.daysUntil} days`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-violet-600 shrink-0">
                        {formatEventDate(event.date, event.daysUntil)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </button>

        {/* Important */}
        <SectionCard icon={Zap} iconClass="bg-rose-100 text-rose-600" title="Important">
          <div>
            {importantEvents.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No important dates saved yet</p>
                <button
                  onClick={() => router.push('/chat')}
                  className="text-xs text-violet-600 font-medium mt-2 hover:underline"
                >
                  Save bills, birthdays, or anniversaries
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {importantEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.daysUntil === 0 ? 'Today' : `${event.daysUntil} days away`}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full ${
                        event.daysUntil <= 3
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatEventDate(event.date, event.daysUntil)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
