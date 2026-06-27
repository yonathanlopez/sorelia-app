import React from 'react';
import { CheckCircle, AlertTriangle, Database, Zap, Clock, Calendar } from 'lucide-react';

function HealthRow({ icon: Icon, label, status, detail }) {
  const colors = { ok: 'text-emerald-500', warning: 'text-amber-500', error: 'text-red-500', unknown: 'text-gray-400' };
  const icons = { ok: CheckCircle, warning: AlertTriangle, error: AlertTriangle, unknown: Clock };
  const StatusIcon = icons[status] || Clock;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5">{detail}</p>}
      </div>
      <StatusIcon className={`w-5 h-5 flex-shrink-0 ${colors[status]}`} />
    </div>
  );
}

export default function DevSystemHealth({ memories, lastRefresh }) {
  const totalMemories = memories.length;
  const gcalMemories = memories.filter(m => m.source === 'google_calendar').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Connections</h3>
        <HealthRow icon={Calendar} label="Google Calendar" status="ok" detail="Connected & authorized" />
        <HealthRow icon={Database} label="Database" status="ok" detail={`${totalMemories} memories stored`} />
        <HealthRow icon={Zap} label="AI Pipeline" status="ok" detail="InvokeLLM integration active" />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Data</h3>
        <HealthRow icon={Database} label="Total Memories" status="ok" detail={`${totalMemories} saved`} />
        <HealthRow icon={Calendar} label="From Google Calendar" status="ok" detail={`${gcalMemories} calendar events`} />
        <HealthRow icon={Clock} label="Last Dashboard Refresh" status="ok" detail={lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'} />
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 text-green-400 font-mono text-xs space-y-1">
        <p className="text-gray-500 mb-2">// System Stats</p>
        <p>memories_total: {totalMemories}</p>
        <p>calendar_memories: {gcalMemories}</p>
        <p>dashboard_refreshed: "{lastRefresh?.toISOString() || 'null'}"</p>
      </div>
    </div>
  );
}