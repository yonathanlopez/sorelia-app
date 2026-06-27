import React, { useState } from 'react';
import { Mail, ChevronRight, Search } from 'lucide-react';

function StatusBadge({ status }) {
  const styles = {
    scanned: 'bg-emerald-100 text-emerald-700',
    processed: 'bg-blue-100 text-blue-700',
    skipped: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || styles.scanned}`}>
      {status}
    </span>
  );
}

export default function DevEmailTable({ emails, memories, onSelect }) {
  const [search, setSearch] = useState('');

  const gmailMemories = memories.filter(m => m.source === 'gmail');
  const filtered = emails.filter(e =>
    !search ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.sender?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emails..."
          className="flex-1 text-sm outline-none bg-transparent"
        />
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} emails scanned · {gmailMemories.length} memories created</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No emails scanned yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(email => (
            <button
              key={email.id}
              onClick={() => onSelect(email)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left flex items-start gap-3 hover:border-violet-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{email.subject}</p>
                  <StatusBadge status="scanned" />
                </div>
                {email.sender && <p className="text-xs text-gray-500 truncate mt-0.5">{email.sender}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {email.date && <p className="text-[10px] text-gray-400">{email.date}</p>}
                  {email.memories_extracted > 0 && (
                    <span className="text-[10px] text-violet-600 font-medium">✨ {email.memories_extracted} memories</span>
                  )}
                  {email.body_preview && (
                    <p className="text-[10px] text-gray-400 truncate flex-1">{email.body_preview.slice(0, 60)}...</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}