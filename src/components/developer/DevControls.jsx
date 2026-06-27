import React, { useState } from 'react';
import { Play, RefreshCw, Trash2, Download, Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function DevControls({ onRunScan, scanning, onRefresh, onClearData }) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleClearTestData() {
    setClearing(true);
    await base44.entities.ScannedEmail.deleteMany({});
    setClearing(false);
    setShowClearDialog(false);
    onClearData();
  }

  function handleExport() {
    base44.entities.ScannedEmail.list('-created_date', 500).then(emails => {
      const data = JSON.stringify(emails, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sorelia-scan-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const buttons = [
    {
      label: scanning ? 'Scanning...' : 'Run Scan Now',
      icon: scanning ? Loader2 : Play,
      spin: scanning,
      onClick: onRunScan,
      disabled: scanning,
      color: 'bg-violet-600 text-white hover:bg-violet-700',
    },
    {
      label: 'Refresh Dashboard',
      icon: RefreshCw,
      onClick: onRefresh,
      color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    },
    {
      label: 'Export Logs',
      icon: Download,
      onClick: handleExport,
      color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    },
    {
      label: 'Clear Scan Logs',
      icon: Trash2,
      onClick: () => setShowClearDialog(true),
      color: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Developer Controls</h3>
      <div className="grid grid-cols-2 gap-2">
        {buttons.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <button
              key={i}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-40 ${btn.color}`}
            >
              <Icon className={`w-4 h-4 ${btn.spin ? 'animate-spin' : ''}`} />
              {btn.label}
            </button>
          );
        })}
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear scan logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all ScannedEmail records. Memories will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearTestData} disabled={clearing} className="rounded-xl bg-red-600 hover:bg-red-700">
              {clearing ? 'Clearing...' : 'Clear logs'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}