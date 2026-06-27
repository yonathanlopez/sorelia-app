import React from 'react';
import { X, Mail, FileText, Brain, CheckCircle, XCircle, Tag, Zap, AlertTriangle } from 'lucide-react';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 break-words">{value}</p>
    </div>
  );
}

function ConfidenceBar({ score }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function DevEmailDetail({ email, memories, onClose }) {
  const emailScanTime = email.created_date ? new Date(email.created_date).getTime() : null;
  const nearbyMemories = emailScanTime
    ? memories.filter(m => Math.abs(new Date(m.created_date).getTime() - emailScanTime) < 60000 * 10)
    : [];

  const memoryTypeColors = {
    important_date: 'bg-violet-100 text-violet-700',
    goal: 'bg-emerald-100 text-emerald-700',
    reminder: 'bg-cyan-100 text-cyan-700',
    life_event: 'bg-amber-100 text-amber-700',
    preference: 'bg-rose-100 text-rose-700',
    person: 'bg-blue-100 text-blue-700',
  };

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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-gray-900 text-sm">Email Detail</h2>
            {email.category_label && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[email.category_label] || 'bg-gray-100 text-gray-600'}`}>
                {email.category_label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-4 pt-4">

          {/* Metadata */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <Row label="Subject" value={email.subject} />
            <Row label="Sender" value={email.sender} />
            <Row label="Date Received" value={email.date} />
            <Row label="Scan Time" value={email.created_date ? new Date(email.created_date).toLocaleString() : null} />
          </div>

          {/* AI Categorization Decision */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-violet-500" />
              <p className="text-xs font-semibold text-gray-800">AI Categorization Decision</p>
            </div>

            {/* Skipped vs processed */}
            {email.was_skipped ? (
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 mb-3">
                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600">Skipped</p>
                  <p className="text-xs text-gray-500 mt-0.5">{email.skip_reason || 'No reason provided'}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-emerald-50 rounded-xl p-3 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 font-medium">Processed — memories extracted</p>
              </div>
            )}

            {/* Reasoning */}
            {email.category_reasoning && (
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Why this category?</p>
                <p className="text-sm text-gray-700 leading-relaxed">{email.category_reasoning}</p>
              </div>
            )}

            {/* Confidence */}
            {email.confidence_score > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Confidence Score</p>
                <ConfidenceBar score={email.confidence_score} />
              </div>
            )}

            {/* Memory types found */}
            {email.memory_types_found?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Memory Types Detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {email.memory_types_found.map(t => (
                    <span key={t} className={`text-[10px] font-semibold px-2 py-1 rounded-full ${memoryTypeColors[t] || 'bg-gray-100 text-gray-600'}`}>
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted entities */}
            {email.extracted_entities && email.extracted_entities !== 'none' && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Extracted Entities</p>
                <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{email.extracted_entities}</p>
              </div>
            )}
          </div>

          {/* Body full */}
          {(email.body_full || email.body_preview) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">Email Content</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                {email.body_full || email.body_preview}
              </div>
            </div>
          )}

          {/* Memories created in same scan */}
          {nearbyMemories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-violet-500" />
                <p className="text-xs font-semibold text-gray-700">Memories Created in This Scan</p>
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

          {!email.was_skipped && nearbyMemories.length === 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">No memories found in this scan batch — the email may not have contained specific extractable facts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}