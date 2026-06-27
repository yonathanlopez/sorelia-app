import React from 'react';
import { Mail, Brain, CheckCircle, XCircle, Clock, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DevOverview({ emails, memories, scanning }) {
  const today = new Date().toDateString();
  const emailsToday = emails.filter(e => new Date(e.created_date).toDateString() === today).length;
  const gmailMemories = memories.filter(m => m.source === 'gmail');
  const chatMemories = memories.filter(m => m.source === 'chat');
  const lastScan = emails[0]?.created_date ? new Date(emails[0].created_date) : null;

  const stats = [
    { icon: Mail, label: 'Emails Scanned', value: emails.length, color: 'bg-blue-50 text-blue-600' },
    { icon: Clock, label: 'Scanned Today', value: emailsToday, color: 'bg-cyan-50 text-cyan-600' },
    { icon: CheckCircle, label: 'Processed', value: emails.length, color: 'bg-emerald-50 text-emerald-600' },
    { icon: Brain, label: 'Total Memories', value: memories.length, color: 'bg-violet-50 text-violet-600' },
    { icon: TrendingUp, label: 'From Gmail', value: gmailMemories.length, color: 'bg-purple-50 text-purple-600' },
    { icon: Zap, label: 'From Chat', value: chatMemories.length, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div>
      {/* Status pill */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          scanning ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-violet-500 animate-pulse' : 'bg-emerald-500'}`} />
          {scanning ? 'Scanning...' : 'Idle'}
        </div>
        {lastScan && (
          <span className="text-xs text-gray-400">
            Last scan: {lastScan.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Memory breakdown by type */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Memory Type Breakdown</h3>
        {['important_date', 'goal', 'life_event', 'reminder', 'preference', 'person'].map(type => {
          const count = memories.filter(m => m.type === type).length;
          const pct = memories.length ? Math.round((count / memories.length) * 100) : 0;
          return (
            <div key={type} className="flex items-center gap-2 mb-2">
              <p className="text-xs text-gray-600 w-32 capitalize">{type.replace('_', ' ')}</p>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-500 w-8 text-right">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}