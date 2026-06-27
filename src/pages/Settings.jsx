import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  User, Mail, Calendar, Trash2, LogOut, ChevronRight,
  Brain, Shield, Bell, RefreshCw, Code2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import BottomNav from '@/components/BottomNav';
import GmailScannerModal from '@/components/sorelia/GmailScannerModal';
import { Link } from 'react-router-dom';

function Row({ icon: Icon, label, sublabel, onClick, danger, right, href }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        <Icon className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>{label}</p>
        {sublabel && <p className="text-[12px] text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {right || <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
    </div>
  );
  if (href) return <Link to={href}>{inner}</Link>;
  return inner;
}

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-5 mb-1">{title}</p>
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 divide-y divide-gray-50 shadow-sm mx-0">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const [user, setUser] = useState(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [me, mems] = await Promise.all([
        base44.auth.me(),
        base44.entities.Memory.list('-created_date', 200),
      ]);
      setUser(me);
      setMemoryCount(mems.length);
    }
    load();
  }, []);

  async function handleClearAll() {
    await base44.entities.Memory.deleteMany({});
    await base44.entities.Conversation.deleteMany({});
    setMemoryCount(0);
    setShowClearDialog(false);
    toast({ title: 'All memories cleared' });
  }

  async function syncCalendar() {
    setSyncingCalendar(true);
    try {
      await base44.functions.invoke('calendarScanner', {});
      toast({ title: 'Calendar synced' });
    } catch {
      toast({ title: 'Calendar sync failed', variant: 'destructive' });
    }
    setSyncingCalendar(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <h1 className="text-[22px] font-bold text-gray-900">Settings</h1>
      </div>

      <div className="px-4 pt-5 space-y-0">

        {/* Account */}
        <Section title="Account">
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{user?.full_name || '—'}</p>
              <p className="text-[12px] text-gray-400">{user?.email}</p>
            </div>
          </div>
        </Section>

        {/* Connections */}
        <Section title="Connections">
          <Row
            icon={Mail}
            label="Gmail"
            sublabel="Scan emails for memories"
            onClick={() => setShowGmailModal(true)}
            right={
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                Scan
              </span>
            }
          />
          <Row
            icon={Calendar}
            label="Google Calendar"
            sublabel={syncingCalendar ? 'Syncing…' : 'Pull events into timeline'}
            onClick={syncCalendar}
            right={
              <RefreshCw className={`w-4 h-4 text-gray-400 flex-shrink-0 ${syncingCalendar ? 'animate-spin' : ''}`} />
            }
          />
        </Section>

        {/* Memory */}
        <Section title="Your Memory">
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-gray-900">Stored memories</p>
              <p className="text-[12px] text-gray-400">{memoryCount} total</p>
            </div>
          </div>
        </Section>

        {/* Developer */}
        {user?.role === 'admin' && (
          <Section title="Developer">
            <Row icon={Code2} label="Developer Dashboard" sublabel="Live metrics & logs" href="/developer" />
          </Section>
        )}

        {/* Danger */}
        <Section title="Data">
          <Row
            icon={Trash2}
            label="Clear all memories"
            sublabel="Permanently delete everything"
            danger
            onClick={() => setShowClearDialog(true)}
          />
          <Row
            icon={LogOut}
            label="Sign out"
            danger
            onClick={() => base44.auth.logout('/')}
          />
        </Section>

        {/* About */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[12px] text-gray-300 font-medium">Sorelia · Personal Life OS</p>
          <p className="text-[11px] text-gray-300 mt-0.5">v1.0</p>
        </div>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all memories?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all your memories and chat history. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="rounded-xl bg-red-600 hover:bg-red-700">
              Clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showGmailModal && (
        <GmailScannerModal
          onClose={() => setShowGmailModal(false)}
          onComplete={() => {
            setShowGmailModal(false);
            toast({ title: 'Memories created from Gmail' });
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}