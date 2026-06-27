import React, { useState } from 'react';
import { Brain, Calendar, Target, Bell, User, Heart, Star, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const typeConfig = {
  important_date: { icon: Calendar, color: 'bg-violet-100 text-violet-600', label: 'Important Date' },
  goal: { icon: Target, color: 'bg-emerald-100 text-emerald-600', label: 'Goal' },
  reminder: { icon: Bell, color: 'bg-cyan-100 text-cyan-600', label: 'Reminder' },
  person: { icon: User, color: 'bg-blue-100 text-blue-600', label: 'Person' },
  preference: { icon: Heart, color: 'bg-rose-100 text-rose-600', label: 'Preference' },
  life_event: { icon: Star, color: 'bg-amber-100 text-amber-600', label: 'Life Event' },
};

function SourceBadge({ source }) {
  if (source === 'gmail') return <span className="text-[10px] bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">Gmail</span>;
  if (source === 'chat') return <span className="text-[10px] bg-violet-50 text-violet-600 font-medium px-2 py-0.5 rounded-full">Chat</span>;
  return <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">{source || 'unknown'}</span>;
}

export default function DevMemoryLog({ memories, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const filters = ['all', 'gmail', 'chat', 'important_date', 'goal', 'life_event', 'reminder', 'preference', 'person'];

  const filtered = memories.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'gmail' || filter === 'chat') return m.source === filter;
    return m.type === filter;
  });

  async function handleDelete(id) {
    setDeleting(id);
    await base44.entities.Memory.delete(id);
    setDeleting(null);
    onRefresh();
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'all' ? `All (${memories.length})` : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No memories found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(mem => {
            const cfg = typeConfig[mem.type] || { icon: Brain, color: 'bg-gray-100 text-gray-600', label: mem.type };
            const Icon = cfg.icon;
            return (
              <div key={mem.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{mem.title}</p>
                      <SourceBadge source={mem.source} />
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cfg.label}</span>
                    </div>
                    {mem.description && <p className="text-xs text-gray-500 mt-1">{mem.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {mem.date && <p className="text-[10px] text-violet-600 font-medium">📅 {mem.date}</p>}
                      {mem.people?.length > 0 && <p className="text-[10px] text-blue-600">👤 {mem.people.join(', ')}</p>}
                      <p className="text-[10px] text-gray-400">{new Date(mem.created_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    disabled={deleting === mem.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}