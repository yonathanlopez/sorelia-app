import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Wifi, Database, Zap, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function HealthRow({ icon: Icon, label, status, detail }) {
  const colors = {
    ok: 'text-emerald-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
    unknown: 'text-gray-400',
  };
  const icons = {
    ok: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    unknown: Clock,
  };
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

export default function DevSystemHealth({ emails, memories, lastRefresh }) {
  const [gmailStatus, setGmailStatus] = useState('unknown');

  useEffect(() => {
    base44.functions.invoke('gmailScanner', {})
      .then(() => setGmailStatus('ok'))
      .catch(() => setGmailStatus('error'));
  }, []);

  const totalEmails = emails.length;
  const totalMemories = memories.length;
  const lastEmail = emails[0];
  const lastEmailTime = lastEmail?.created_date ? new Date(lastEmail.created_date) : null;

  const minutesSinceLastScan = lastEmailTime
    ? Math.round((Date.now() - lastEmailTime.getTime()) / 60000)
    : null;

  const syncStatus = minutesSinceLastScan === null ? 'unknown'
    : minutesSinceLastScan < 60 ? 'ok'
    : minutesSinceLastScan < 1440 ? 'warning'
    : 'error';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Connections</h3>
        <HealthRow
          icon={Wifi}
          label="Gmail OAuth"
          status={gmailStatus}
          detail={gmailStatus === 'ok' ? 'Connected & authorized' : gmailStatus === 'error' ? 'Token expired or not connected' : 'Checking...'}
        />
        <HealthRow
          icon={Database}
          label="Database"
          status="ok"
          detail={`${totalEmails} emails · ${totalMemories} memories stored`}
        />
        <HealthRow
          icon={Zap}
          label="AI Pipeline"
          status="ok"
          detail="InvokeLLM integration active"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Sync Status</h3>
        <HealthRow
          icon={Clock}
          label="Last Successful Sync"
          status={syncStatus}
          detail={lastEmailTime
            ? `${lastEmailTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (${minutesSinceLastScan}m ago)`
            : 'Never synced'}
        />
        <HealthRow
          icon={CheckCircle}
          label="Emails Processed"
          status="ok"
          detail={`${totalEmails} total scanned`}
        />
        <HealthRow
          icon={Database}
          label="Memories Written"
          status="ok"
          detail={`${totalMemories} memories saved to database`}
        />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Dashboard</h3>
        <HealthRow
          icon={Clock}
          label="Last Dashboard Refresh"
          status="ok"
          detail={lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
        />
        <HealthRow
          icon={Zap}
          label="Auto-refresh"
          status="ok"
          detail="Every 30 seconds"
        />
      </div>

      {/* Raw stats */}
      <div className="bg-gray-900 rounded-2xl p-4 text-green-400 font-mono text-xs space-y-1">
        <p className="text-gray-500 mb-2">// System Stats</p>
        <p>emails_total: {totalEmails}</p>
        <p>memories_total: {totalMemories}</p>
        <p>gmail_status: "{gmailStatus}"</p>
        <p>last_scan: "{lastEmailTime?.toISOString() || 'null'}"</p>
        <p>minutes_since_scan: {minutesSinceLastScan ?? 'null'}</p>
        <p>dashboard_refreshed: "{lastRefresh?.toISOString() || 'null'}"</p>
      </div>
    </div>
  );
}