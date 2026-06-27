import React from 'react';
import { X, Mail, Calendar, User, FileText, Brain, CheckCircle } from 'lucide-react';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 break-words">{value}</p>
    </div>
  );
}

export default function DevEmailDetail({ email, memories, onClose }) {
  // Try to find memories created around the same time as the email scan
  const emailScanTime = email.created_date ? new Date(email.created_date).getTime() : null;
  const nearbyMemories = emailScanTime
    ? memories.filter(m => Math.abs(new Date(m.created_date).getTime() - emailScanTime) < 60000 * 10)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-gray-900 text-sm">Email Detail</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {/* Metadata */}
          <div className="bg-gray-50 rounded-2xl p-4 mt-4">
            <Row label="Subject" value={email.subject} />
            <Row label="Sender" value={email.sender} />
            <Row label="Date Received" value={email.date} />
            <Row label="Scan Time" value={email.created_date ? new Date(email.created_date).toLocaleString() : null} />
          </div>

          {/* Body preview */}
          {email.body_preview && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">Email Content Preview</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed font-mono">
                {email.body_preview}
              </div>
            </div>
          )}

          {/* AI Pipeline Steps */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-violet-500" />
              <p className="text-xs font-semibold text-gray-700">AI Processing Pipeline</p>
            </div>
            <div className="space-y-2">
              {[
                'Email fetched from Gmail API',
                'Body text extracted & cleaned',
                'Content sent to AI for classification',
                'Entities & memories extracted',
                'Memory candidates generated',
                'Records saved to database',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Memories from this scan batch */}
          {nearbyMemories.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <p className="text-xs font-semibold text-gray-700">Memories Created in Same Scan</p>
              </div>
              <div className="space-y-2">
                {nearbyMemories.slice(0, 5).map(mem => (
                  <div key={mem.id} className="bg-violet-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-violet-800">{mem.title}</p>
                    {mem.description && <p className="text-xs text-violet-600 mt-0.5">{mem.description}</p>}
                    <p className="text-[10px] text-violet-400 mt-1 capitalize">{mem.type?.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nearbyMemories.length === 0 && (
            <div className="mt-4 bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-400">No memories found in this scan batch.</p>
              <p className="text-[10px] text-gray-300 mt-1">Email may have been scanned without generating memories.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}