'use client';

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, LogOut, User, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const { user } = useAuth();
  const [memoryCount, setMemoryCount] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const mems = await base44.entities.Calendar.list('-created_date', 200);
      setMemoryCount(mems.length);
    }
    load();
  }, []);

  async function handleClearAll() {
    await base44.entities.Calendar.deleteMany({});
    await base44.entities.Conversation.deleteMany({});
    setMemoryCount(0);
    setShowClearDialog(false);
    toast({ title: '🗑️ Everything has been reset' });
  }

  async function syncCalendar() {
    setSyncingCalendar(true);
    try {
      await base44.functions.invoke('calendarScanner', {});
      toast({ title: '✨ Calendar synced!' });
    } catch {
      toast({ title: 'Calendar sync failed', variant: 'destructive' });
    }
    setSyncingCalendar(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-600 px-6 pt-14 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{user?.full_name || 'User'}</h1>
            <p className="text-violet-200 text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex-1 text-center">
            <p className="text-white text-xl font-bold">{memoryCount}</p>
            <p className="text-violet-200 text-[11px] mt-0.5">Memories</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex-1 text-center">
            <p className="text-white text-xl font-bold">
              {user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
            </p>
            <p className="text-violet-200 text-[11px] mt-0.5">Joined</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Connections */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Connections</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Google Calendar</p>
                <p className="text-xs text-gray-400">Connected</p>
              </div>
            </div>
            <button
              onClick={syncCalendar}
              disabled={syncingCalendar}
              className="flex items-center gap-1.5 text-xs font-medium bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${syncingCalendar ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-gray-900">About Sorelia</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sorelia is your personal memory assistant — she remembers the people, dates, goals, and moments that matter most to you.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 justify-start gap-3 text-red-600 border-red-100 hover:bg-red-50"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            Clear all memories
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 justify-start gap-3 text-gray-600"
            onClick={() => base44.auth.logout('/')}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all memories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your memories and chat history. This can't be undone.
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

      <BottomNav />
    </div>
  );
}