import React, { useMemo } from 'react';
import { Brain, Clock } from 'lucide-react';

function FeedItem({ icon: Icon, color, text, sub, time }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{text}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{time}</p>
    </div>
  );
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const diffMins = Math.round((Date.now() - d) / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function DevActivityFeed({ memories }) {
  const events = useMemo(() => {
    return memories
      .map(mem => ({
        icon: Brain,
        color: 'bg-violet-100 text-violet-600',
        text: `Memory: "${mem.title}"`,
        sub: `Type: ${mem.type} · Source: ${mem.source || 'unknown'}`,
        ts: new Date(mem.created_date).getTime(),
        time: mem.created_date,
      }))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 50);
  }, [memories]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs text-gray-500 font-medium">Memory Log · {events.length} entries</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No memories yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-50">
          {events.map((e, i) => (
            <FeedItem key={i} icon={e.icon} color={e.color} text={e.text} sub={e.sub} time={formatTime(e.time)} />
          ))}
        </div>
      )}
    </div>
  );
}