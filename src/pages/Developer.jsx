import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import BottomNav from '@/components/BottomNav';
import DevOverview from '@/components/developer/DevOverview';
import DevEmailTable from '@/components/developer/DevEmailTable';
import DevMemoryLog from '@/components/developer/DevMemoryLog';
import DevSystemHealth from '@/components/developer/DevSystemHealth';
import DevActivityFeed from '@/components/developer/DevActivityFeed';
import DevControls from '@/components/developer/DevControls';
import DevEmailDetail from '@/components/developer/DevEmailDetail';
import { RefreshCw, Terminal } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'emails', label: 'Emails' },
  { key: 'memories', label: 'Memories' },
  { key: 'health', label: 'Health' },
  { key: 'feed', label: 'Feed' },
];

export default function Developer() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [emails, setEmails] = useState([]);
  const [memories, setMemories] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const [emailList, memoryList] = await Promise.all([
      base44.entities.ScannedEmail.list('-created_date', 100),
      base44.entities.Memory.list('-created_date', 200),
    ]);
    setEmails(emailList);
    setMemories(memoryList);
    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    async function init() {
      const me = await base44.auth.me();
      setUser(me);
      setIsAdmin(me?.role === 'admin');
    }
    init();
    loadData();
    // Auto-refresh every 30s
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleRunScan() {
    setScanning(true);
    try {
      await base44.functions.invoke('gmailScanner', {});
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-24">
        <Terminal className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Admin Only</h2>
        <p className="text-sm text-gray-400 mt-1">This section is restricted to administrators.</p>
        <BottomNav />
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 pt-12 pb-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-400" />
            <h1 className="font-bold text-base">Developer Dashboard</h1>
            <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">ADMIN</span>
          </div>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5">
        {activeTab === 'overview' && (
          <>
            <DevOverview emails={emails} memories={memories} scanning={scanning} />
            <div className="mt-5">
              <DevControls onRunScan={handleRunScan} scanning={scanning} onRefresh={loadData} onClearData={loadData} />
            </div>
          </>
        )}
        {activeTab === 'emails' && (
          <DevEmailTable emails={emails} memories={memories} onSelect={setSelectedEmail} />
        )}
        {activeTab === 'memories' && (
          <DevMemoryLog memories={memories} emails={emails} onRefresh={loadData} />
        )}
        {activeTab === 'health' && (
          <DevSystemHealth emails={emails} memories={memories} lastRefresh={lastRefresh} />
        )}
        {activeTab === 'feed' && (
          <DevActivityFeed emails={emails} memories={memories} />
        )}
      </div>

      {selectedEmail && (
        <DevEmailDetail
          email={selectedEmail}
          memories={memories.filter(m => m.source === 'gmail')}
          onClose={() => setSelectedEmail(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}