import React, { useState } from 'react';
import { Mail, ChevronRight, Search, CheckCircle, XCircle } from 'lucide-react';

const categoryColors = {
  Travel: 'bg-blue-100 text-blue-700',
  'Important Date': 'bg-violet-100 text-violet-700',
  'Life Event': 'bg-amber-100 text-amber-700',
  'Work/Career': 'bg-indigo-100 text-indigo-700',
  Finance: 'bg-green-100 text-green-700',
  Health: 'bg-red-100 text-red-700',
  Purchase: 'bg-orange-100 text-orange-700',
  Event: 'bg-pink-100 text-pink-700',
  Personal: 'bg-purple-100 text-purple-700',
  Skip: 'bg-gray-100 text-gray-500',
  Unknown: 'bg-gray-100 text-gray-400',
};

export default function DevEmailTable({ emails, memories, onSelect }) {
  const [search, setSearch] = useState('');
  const [filterSkipped, setFilterSkipped] = useState('all');

  const gmailMemories = memories.filter(m => m.source === 'gmail');

  const filtered = emails.filter(e => {
    const matchSearch = !search ||
      e.subject?.toLowerCase().includes(search.toLowerCase()) ||
      e.sender?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterSkipped === 'all' ||
      (filterSkipped === 'processed' && !e.was_skipped) ||
      (filterSkipped === 'skipped' && e.was_skipped);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 mb-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emails..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      <div className="flex gap-2 mb-3">
        {['all', 'processed', 'skipped'].map(f => (
          <button
            key={f}
            onClick={() => setFilterSkipped(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filterSkipped === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} emails · {gmailMemories.length} memories created</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No emails scanned yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(email => {
            const catColor = categoryColors[email.category_label] || categoryColors.Unknown;
            return (
              <button
                key={email.id}
                onClick={() => onSelect(email)}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left flex items-start gap-3 hover:border-violet-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {email.was_skipped
                    ? <XCircle className="w-4 h-4 text-gray-400" />
                    : <CheckCircle className="w-4 h-4 text-emerald-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{email.subject}</p>
                    {email.category_label && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${catColor}`}>
                        {email.category_label}
                      </span>
                    )}
                  </div>
                  {email.sender && <p className="text-xs text-gray-500 truncate mt-0.5">{email.sender}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {email.confidence_score > 0 && (
                      <span className={`text-[10px] font-medium ${
                        email.confidence_score >= 70 ? 'text-emerald-600' :
                        email.confidence_score >= 40 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {email.confidence_score}% confidence
                      </span>
                    )}
                    {email.memory_types_found?.length > 0 && (
                      <span className="text-[10px] text-violet-600">
                        {email.memory_types_found.join(', ')}
                      </span>
                    )}
                    {email.was_skipped && email.skip_reason && (
                      <span className="text-[10px] text-gray-400 truncate">{email.skip_reason}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}