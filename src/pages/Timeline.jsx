import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, MapPin, Sparkles } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const typeEmoji = {
  life_event: '🌟',
  goal: '🎯',
  important_date: '📅',
  person: '👤',
  preference: '💜',
  reminder: '🔔',
};

const typeColor = {
  life_event: 'bg-amber-100 text-amber-700 border-amber-200',
  goal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  important_date: 'bg-violet-100 text-violet-700 border-violet-200',
  person: 'bg-blue-100 text-blue-700 border-blue-200',
  preference: 'bg-pink-100 text-pink-700 border-pink-200',
  reminder: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const dotColor = {
  life_event: 'bg-amber-400',
  goal: 'bg-emerald-400',
  important_date: 'bg-violet-500',
  person: 'bg-blue-400',
  preference: 'bg-pink-400',
  reminder: 'bg-cyan-400',
};

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  useEffect(() => { loadTimeline(); }, []);

  async function loadTimeline() {
    setLoading(true);
    const memories = await base44.entities.Memory.list('date', 200);
    // Group and sort by year
    const withYear = memories
      .filter(m => m.date)
      .map(m => {
        const yearMatch = m.date.match(/\b(19|20)\d{2}\b/);
        return { ...m, year: yearMatch ? parseInt(yearMatch[0]) : null };
      })
      .filter(m => m.year)
      .sort((a, b) => a.year - b.year || a.date.localeCompare(b.date));

    setEvents(withYear);
    setLoading(false);
  }

  async function buildFromData() {
    setBuilding(true);
    const [allMemories, scannedEmails] = await Promise.all([
      base44.entities.Memory.list('-created_date', 100),
      base44.entities.ScannedEmail.list('-created_date', 50),
    ]);

    const memorySummary = allMemories.map(m =>
      `- [${m.type}] ${m.title}${m.description ? ': ' + m.description : ''}${m.date ? ' (date: ' + m.date + ')' : ''}`
    ).join('\n');

    const emailSummary = scannedEmails.slice(0, 20).map(e =>
      `- ${e.subject}${e.extracted_entities && e.extracted_entities !== 'none' ? ': ' + e.extracted_entities : ''}`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Based on the memories and emails below, extract all significant life events that have a year or date attached. These should be milestones: career changes, graduations, moves, relationships, founding companies, travel, achievements.

Memories:
${memorySummary}

Emails:
${emailSummary}

Return JSON with "events" array. Each event:
{ "type": "life_event"|"goal"|"important_date"|"person"|"preference"|"reminder", "title": string, "description": string (optional), "date": string (must include a year, e.g. "2023" or "March 2023") }

Only include events with a clear year. Max 30 events. Sort oldest first.`,
      model: 'gpt_5_5',
      response_json_schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                date: { type: 'string' },
              },
              required: ['type', 'title', 'date'],
            },
          },
        },
      },
    });

    // Save new timeline events as memories
    if (result?.events?.length > 0) {
      for (const ev of result.events) {
        const exists = allMemories.find(m => m.title === ev.title);
        if (!exists) {
          await base44.entities.Memory.create({
            type: ev.type,
            title: ev.title,
            description: ev.description || '',
            date: ev.date,
            people: [],
            source: 'timeline',
          });
        }
      }
    }

    await loadTimeline();
    setBuilding(false);
  }

  // Group events by year then month
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthOrder = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };

  function getMonthIndex(dateStr) {
    if (!dateStr) return null;
    const lower = dateStr.toLowerCase();
    for (const [name, idx] of Object.entries(monthOrder)) {
      if (lower.includes(name)) return idx;
    }
    const numMatch = dateStr.match(/\b(\d{1,2})[\/\-](\d{4})\b/);
    if (numMatch) return parseInt(numMatch[1]) - 1;
    return null;
  }

  const withMonth = events.map(ev => ({ ...ev, monthIndex: getMonthIndex(ev.date) }));

  const grouped = withMonth.reduce((acc, ev) => {
    if (!acc[ev.year]) acc[ev.year] = {};
    const key = ev.monthIndex !== null ? ev.monthIndex : 'unknown';
    if (!acc[ev.year][key]) acc[ev.year][key] = [];
    acc[ev.year][key].push(ev);
    return acc;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Life Timeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your journey, mapped out</p>
        </div>
        <button
          onClick={buildFromData}
          disabled={building || loading}
          className="flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-600 px-3 py-2 rounded-full disabled:opacity-40 hover:bg-violet-100 transition-colors"
        >
          {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {building ? 'Building...' : 'Build from data'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading your timeline…</p>
          </div>
        ) : years.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">No timeline yet</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">Tap "Build from data" to let Sorelia reconstruct your life journey from your memories and emails.</p>
            </div>
            <button
              onClick={buildFromData}
              disabled={building}
              className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Build My Timeline
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical road line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-300 via-violet-200 to-transparent" />

            <div className="space-y-0">
              {years.map((year) => {
                const monthKeys = Object.keys(grouped[year]).sort((a, b) => {
                  if (a === 'unknown') return 1;
                  if (b === 'unknown') return -1;
                  return a - b;
                });
                return (
                  <div key={year}>
                    {/* Year marker */}
                    <div className="relative flex items-center gap-4 mb-4 mt-2">
                      <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center z-10 shadow-lg flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">{year}</span>
                      </div>
                      <div className="h-px flex-1 bg-violet-100" />
                    </div>

                    {/* Months */}
                    <div className="pl-16 mb-6 space-y-4">
                      {monthKeys.map((mKey) => (
                        <div key={mKey}>
                          {/* Month label */}
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            {mKey === 'unknown' ? 'Unknown month' : MONTHS[parseInt(mKey)]}
                          </p>
                          <div className="space-y-3">
                            {grouped[year][mKey].map((ev, i) => (
                              <div key={ev.id || i} className="relative">
                                <div className={`absolute -left-[2.15rem] top-3.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dotColor[ev.type] || 'bg-violet-400'}`} />
                                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg leading-none mt-0.5">{typeEmoji[ev.type] || '📌'}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 leading-snug">{ev.title}</p>
                                      {ev.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ev.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColor[ev.type] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                          {ev.type?.replace('_', ' ')}
                                        </span>
                                        {ev.date && ev.date !== String(ev.year) && (
                                          <span className="text-[10px] text-gray-400">{ev.date}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Road end marker */}
              <div className="relative flex items-center gap-4 pl-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center z-10 shadow-md flex-shrink-0 ml-1">
                  <span className="text-lg">✨</span>
                </div>
                <p className="text-xs text-gray-400 italic">Your story continues…</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}