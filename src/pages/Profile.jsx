import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, LogOut, User, Mail, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showClearDialog, setShowClearDialog] = useState(false);
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
    const mems = await base44.entities.Memory.list('-created_date', 200);
    for (const m of mems) {
      await base44.entities.Memory.delete(m.id);
    }
    const convos = await base44.entities.Conversation.list('-created_date', 200);
    for (const c of convos) {
      await base44.entities.Conversation.delete(c.id);
    }
    setMemoryCount(0);
    setShowClearDialog(false);
    toast({ title: 'All memories cleared' });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        <h1 className="font-semibold text-gray-900 text-lg">Profile</h1>
      </div>

      <div className="px-5 pt-6 space-y-4">
        {/* User info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user?.full_name || 'User'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-violet-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-violet-600">{memoryCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Memories</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500">
                  Joined {user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold text-gray-900">About Sorelia</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sorelia is your personal memory assistant. She remembers the people, dates, goals, and moments that matter to you — so you never forget what's important.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
            Clear all memories
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 justify-start gap-3"
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