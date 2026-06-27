import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AddMemoryDialog({ type, open, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', date: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const typeLabels = {
    goal: 'Goal',
    important_date: 'Important Date',
    preference: 'Preference',
    life_event: 'Life Event',
    reminder: 'Reminder',
  };

  const handleSave = () => {
    onSave({ type, title: form.title, description: form.description, date: form.date, people: [] });
    setForm({ title: '', description: '', date: '' });
  };

  const showDate = ['important_date', 'reminder', 'life_event', 'goal'].includes(type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add {typeLabels[type] || 'Memory'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs text-gray-500">Title *</Label>
            <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Short title..." />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Description</Label>
            <Textarea className="mt-1" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="More details..." />
          </div>
          {showDate && (
            <div>
              <Label className="text-xs text-gray-500">Date</Label>
              <Input className="mt-1" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}