import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const typeEmoji = {
  life_event: '🌟',
  goal: '🎯',
  important_date: '📅',
  person: '👤',
  preference: '💜',
  reminder: '🔔',
};

const typeDot = {
  life_event: 'bg-amber-400',
  goal: 'bg-emerald-400',
  important_date: 'bg-violet-500',
  person: 'bg-blue-400',
  preference: 'bg-pink-400',
  reminder: 'bg-cyan-400',
};

const typeCard = {
  life_event: 'border-amber-200',
  goal: 'border-emerald-200',
  important_date: 'border-violet-200',
  person: 'border-blue-200',
  preference: 'border-pink-200',
  reminder: 'border-cyan-200',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const monthOrder = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11
};

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

export default function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null); // { year, monthIndex }
  const scrubberRef = useRef(null);

  useEffect(() => { loadTimeline(); }, []);

  async function loadTimeline() {
    setLoading(true);
    const memories = await base44.entities.Memory.list('date', 200);
    const withMeta = memories
      .filter(m => m.date)
      .map(m => {
        const yearMatch = m.date.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : null;
        const monthIndex = getMonthIndex(m.date);
        return { ...m, year, monthIndex };
      })
      .filter(m => m.year)
      .sort((a, b) => a.year - b.year || (a.monthIndex ?? 99) - (b.monthIndex ?? 99));

    setEvents(withMeta);

    // Auto-select first month
    if (withMeta.length > 0) {
      setSelectedMonth({ year: withMeta[0].year, monthIndex: withMeta[0].monthIndex });
    }
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
      prompt: `Based on the memories and emails below, extract all significant life events with dates. Include milestones, goals, travel, relationships, career events, achievements.

Memories:
${memorySummary}

Emails:
${emailSummary}

Return JSON with "events" array. Each: { "type": "life_event"|"goal"|"important_date"|"person"|"preference"|"reminder", "title": string, "description": string (optional), "date": string (must include year, e.g. "March 2023") }
Only events with a clear year. Max 30. Sort oldest first.`,
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

  // Build ordered list of unique (year, monthIndex) pairs
  const monthSlots = [];
  const seen = new Set();
  for (const ev of events) {
    const key = `${ev.year}-${ev.monthIndex ?? 'u'}`;
    if (!seen.has(key)) {
      seen.add(key);
      monthSlots.push({ year: ev.year, monthIndex: ev.monthIndex });
    }
  }

  const selectedKey = selectedMonth ? `${selectedMonth.year}-${selectedMonth.monthIndex ?? 'u'}` : null;
  const selectedIdx = monthSlots.findIndex(s => `${s.year}-${s.monthIndex ?? 'u'}` === selectedKey);

  function scrollScrubber(dir) {
    if (!scrubberRef.current) return;
    scrubberRef.current.scrollBy({ left: dir * 120, behavior: 'smooth' });
  }

  const visibleEvents = selectedMonth
    ? events.filter(ev => ev.year === selectedMonth.year && ev.monthIndex === selectedMonth.monthIndex)
    : events;

  return (
    <div className="min-h-screen bg-[#F7F7FB] flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your memory map</h1>
            <p className="text-xs text-gray-400 mt-0.5">A timeline of moments Sorelia has remembered.</p>
          </div>
          <button
            onClick={buildFromData}
            disabled={building || loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-600 px-3 py-2 rounded-full disabled:opacity-40 hover:bg-violet-100 transition-colors"
          >
            {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {building ? 'Building…' : 'Build'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
          <p className="text-sm text-gray-400">Loading your timeline…</p>
        </div>
      ) : monthSlots.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800">No timeline yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">Tap "Build" to let Sorelia reconstruct your life journey from your memories and emails.</p>
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
        <>
          {/* Month scrubber */}
          <div className="bg-white border-b border-gray-100 px-2 py-3 flex items-center gap-1">
            <button onClick={() => scrollScrubber(-1)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={scrubberRef}
              className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none' }}
            >
              {monthSlots.map((slot) => {
                const key = `${slot.year}-${slot.monthIndex ?? 'u'}`;
                const isActive = key === selectedKey;
                const label = slot.monthIndex !== null ? MONTHS[slot.monthIndex] : '?';
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMonth(slot)}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className={`text-[10px] ${isActive ? 'text-violet-200' : 'text-gray-400'}`}>{slot.year}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => scrollScrubber(1)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Events for selected month */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {selectedMonth && (
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                {selectedMonth.monthIndex !== null ? MONTHS[selectedMonth.monthIndex] : '?'} {selectedMonth.year}
              </p>
            )}

            {/* Connecting line */}
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-violet-100 z-0" />

              <div className="space-y-3 relative z-10">
                {visibleEvents.map((ev, i) => (
                  <div key={ev.id || i} className="flex items-start gap-4">
                    {/* Dot */}
                    <div className={`w-3 h-3 rounded-full mt-3.5 flex-shrink-0 border-2 border-white shadow ${typeDot[ev.type] || 'bg-violet-400'}`} />
                    {/* Card */}
                    <div className={`flex-1 bg-white rounded-2xl px-4 py-3.5 shadow-sm border ${typeCard[ev.type] || 'border-gray-100'}`}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{typeEmoji[ev.type] || '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug">{ev.title}</p>
                          {ev.date && (
                            <p className="text-[11px] text-violet-500 font-medium mt-0.5">{ev.date}</p>
                          )}
                          {ev.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ev.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visibleEvents.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400">No events for this month.</div>
              )}
            </div>

            {/* Nav between months */}
            <div className="flex justify-between mt-6">
              <button
                disabled={selectedIdx <= 0}
                onClick={() => setSelectedMonth(monthSlots[selectedIdx - 1])}
                className="flex items-center gap-1.5 text-xs text-gray-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {selectedIdx > 0 ? `${MONTHS[monthSlots[selectedIdx-1].monthIndex] || '?'} ${monthSlots[selectedIdx-1].year}` : ''}
              </button>
              <button
                disabled={selectedIdx >= monthSlots.length - 1}
                onClick={() => setSelectedMonth(monthSlots[selectedIdx + 1])}
                className="flex items-center gap-1.5 text-xs text-gray-400 disabled:opacity-30 hover:text-violet-600 transition-colors"
              >
                {selectedIdx < monthSlots.length - 1 ? `${MONTHS[monthSlots[selectedIdx+1].monthIndex] || '?'} ${monthSlots[selectedIdx+1].year}` : ''}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}