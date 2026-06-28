import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, Clock, Gift, Home as HomeIcon, Shield, Zap, ChevronRight, Sparkles, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import SoreliaFAB from '@/components/SoreliaFAB';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [completedToday, setCompletedToday] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const mems = await base44.entities.Calendar.list('-created_date', 200);
      return mems;
    },
  });

  const loading = memoriesLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>);

  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count stats
  const totalGoals = memories.filter((m) => m.type === 'goal').length;
  const completedGoals = memories.filter((m) => m.type === 'goal' && m.status === 'completed').length;

  const upcomingEvents = memories
  .filter((m) => m.date)
  .map((m) => ({ id: m.id, title: m.title, date: m.date, type: m.type, description: m.description, date_type: m.date_type }))
  .map((ev) => ({ ...ev, daysUntil: getDaysUntil(ev.date) }))
  .filter((ev) => ev.daysUntil >= 0 && ev.daysUntil <= 90)
  .sort((a, b) => a.daysUntil - b.daysUntil);

  const todayTasks = memories.
  filter((m) => getDaysUntil(m.date?.split('T')[0]) === 0).
  map((m) => ({
    title: m.title,
    id: m.id,
    time: m.date && m.date.includes('T') ? new Date(m.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
  })).
  sort((a, b) => {
    const timeA = a.time ? new Date(`2000-01-01 ${a.time}`).getTime() : Infinity;
    const timeB = b.time ? new Date(`2000-01-01 ${b.time}`).getTime() : Infinity;
    return timeA - timeB;
  });

  const importantEvents = upcomingEvents.slice(0, 5);

  const upcomingCal = upcomingEvents.filter((e) => e.daysUntil > 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 4);

  const userName = user?.full_name?.split(' ')[0] || 'there';

  const getTimeIcon = (dateType) => {
    const icons = { birthday: Gift, bills: HomeIcon, anniversary: Zap };
    return icons[dateType] || Gift;
  };

  async function handleDone(id) {
    const isCurrentlyCompleted = completedToday.has(id);
    if (isCurrentlyCompleted) {
      setCompletedToday((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setCompletedToday((prev) => new Set([...prev, id]));
    }
    try {
      const newStatus = isCurrentlyCompleted ? 'active' : 'completed';
      await base44.entities.Memory.update(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    } catch {}
  }

  return (
    <div className="min-h-screen pb-28 hide-scrollbar bg-gray-100">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4 bg-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-bold text-gray-900 text-2xl">Good evening,</h1>
            <h1 className="font-bold text-gray-900 text-2xl">{userName} 🌙</h1>
            <p className="text-sm text-gray-500 mt-1">Here's what's ahead.</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center text-violet-500">
            
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-2xl shadow-sm flex items-center justify-around divide-x divide-gray-200 px-2 py-2 mx-2">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="bg-violet-50 p-2.5 rounded-full text-violet-600">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Tasks</span>
          <span className="text-xl font-bold text-gray-900">{totalGoals}</span>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Completed</span>
          <span className="text-xl font-bold text-gray-900">{completedGoals}</span>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="bg-orange-50 p-2.5 rounded-full text-orange-600">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-gray-500">Day streak</span>
          <span className="text-xl font-bold text-gray-900">{upcomingCal.length}</span>
        </div>
      </div>

      {/* Today */}
      <div className="px-2 py-2">
        <div className="bg-white rounded-xl border border-gray-100 p-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <Clock className="w-3 h-3" />
              </div>
              <h2 className="font-semibold text-gray-900">Today</h2>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            

            
          </div>
          <div className="divide-y divide-gray-50">
            {todayTasks.length === 0 ?
            <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-400">No tasks for today</p>
                <button
                onClick={() => navigate('/')}
                className="text-xs text-violet-600 font-medium mt-2 hover:underline">
                  Ask Sorelia to add a task
                </button>
              </div> :

            todayTasks.map((task) =>
            <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-medium text-gray-500 w-12">{task.time}</span>
                  <span className="flex-1 text-sm text-gray-700">{task.title}</span>
                  <button
                onClick={() => handleDone(task.id)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                completedToday.has(task.id) ?
                'bg-emerald-500 border-emerald-500' :
                'border-gray-300 hover:border-gray-400'}`
                }>
                
                    {completedToday.has(task.id) && <Check className="w-3 h-3 text-white" />}
                  </button>
                </div>
            )
            }
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="py-2 px-2" onClick={() => navigate('/calendar')} role="button" className="cursor-pointer">
          <div className="bg-white rounded-xl border border-gray-100 py-2 px-2 mx-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-3 h-3" />
                </div>
                <h2 className="font-semibold text-gray-900">Upcoming</h2>
              </div>
            </div>
            <div className="px-4 py-3">
              {upcomingCal.length === 0 ?
            <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No upcoming events</p>
                  <button
                onClick={() => navigate('/')}
                className="text-xs text-violet-600 font-medium mt-2 hover:underline">
                    Ask Sorelia to add birthdays, anniversaries, or dates
                  </button>
                </div> :

            <div className="space-y-3">
                  {upcomingCal.map((event, idx) =>
              <div key={event.id} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                  idx === 0 ? 'border-violet-600 bg-violet-600' : 'border-gray-300'}`
                  } />
                      {idx < upcomingCal.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.date && event.date.includes('T') 
                          ? new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                          : (event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil}d away`)
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-violet-600">
                        {event.daysUntil === 0 ? 'Today' : event.daysUntil === 1 ? 'Tomorrow' : `${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
              )}
                </div>
            }
            </div>
          </div>
        </div>

      {/* Important */}
      <div className="py-2 px-2">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Zap className="w-3 h-3" />
                </div>
                <h2 className="font-semibold text-gray-900">Important</h2>
              </div>
            </div>
            <div>
              {importantEvents.length === 0 ?
            <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No important dates</p>
                  <button
                onClick={() => navigate('/')}
                className="text-xs text-violet-600 font-medium mt-2 hover:underline">
                    Ask Sorelia to save bills, anniversaries, or special dates
                  </button>
                </div> :

            <div className="divide-y divide-gray-50">
                  {importantEvents.map((event) => {
                const Icon = getTimeIcon(event.date_type);
                return (
                  <div key={event.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-5 h-5 text-violet-600 flex-shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.daysUntil === 0 ? 'Today' : `${event.daysUntil}d away`}</p>
                      </div>
                      <p className={`text-xs font-medium ${event.daysUntil === 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {event.daysUntil === 0 ? 'Today' : new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>);
              })}
                </div>
            }
            </div>
          </div>
        </div>

      <BottomNav />
    </div>);

}