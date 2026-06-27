import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import BottomNav from '@/components/BottomNav';
import SoreliaFAB from '@/components/SoreliaFAB';
import { RefreshCw, Terminal, Calendar, Clock, MapPin, Trash2 } from 'lucide-react';

export default function Developer() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [calEvents, setCalEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const [memories, calRes] = await Promise.all([
      base44.entities.Memory.filter({ source: 'google_calendar' }),
      base44.functions.invoke('calendarScanner', {}).catch(() => null),
    ]);
    setCalEvents(memories.sort((a, b) => (a.date || '').localeCompare(b.date || '')));
    setLiveEvents(calRes?.data?.events || []);
    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    async function init() {
      const me = await base44.auth.me();
      setUser(me);
      setIsAdmin(me?.role === 'admin');
    }
    init();
    loadData();
  }, [loadData]);

  async function handleDelete(id) {
    setDeleting(id);
    await base44.entities.Memory.delete(id);
    setCalEvents(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-24">
        <Terminal className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Admin Only</h2>
        <p className="text-sm text-gray-400 mt-1">This section is restricted to administrators.</p>
        <BottomNav />
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-400" />
            <h1 className="font-bold text-base">Developer Dashboard</h1>
            <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">ADMIN</span>
          </div>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Refresh'}
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
            <p className="text-white text-lg font-bold">{liveEvents.length}</p>
            <p className="text-gray-400 text-[10px]">Live Events</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
            <p className="text-white text-lg font-bold">{calEvents.length}</p>
            <p className="text-gray-400 text-[10px]">Saved Memories</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Live events from Google Calendar API */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live from Google Calendar ({liveEvents.length})</h2>
          </div>
          {liveEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No live events. Tap refresh to sync.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {liveEvents.map((ev, i) => (
                <CalEventRow key={ev.id || i} event={ev} live />
              ))}
            </div>
          )}
        </div>

        {/* Saved calendar memories */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Saved Calendar Memories ({calEvents.length})</h2>
          </div>
          {calEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No saved calendar memories yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calEvents.map(mem => (
                <div key={mem.id} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{mem.title}</p>
                    {mem.date && (
                      <p className="text-xs text-violet-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {mem.date.includes('T')
                          ? new Date(mem.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                          : new Date(mem.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        }
                      </p>
                    )}
                    {mem.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{mem.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    disabled={deleting === mem.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SoreliaFAB />
      <BottomNav />
    </div>
  );
}

function CalEventRow({ event }) {
  const start = event.start || event.date || '';
  const dateStr = start.split('T')[0];
  const hasTime = start.includes('T');
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : null;

  return (
    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{event.title || event.summary}</p>
        {d && (
          <p className="text-xs text-sky-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {hasTime
              ? new Date(start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
              : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
          </p>
        )}
        {event.location && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{event.location}
          </p>
        )}
        {event.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>
        )}
      </div>
    </div>
  );
}