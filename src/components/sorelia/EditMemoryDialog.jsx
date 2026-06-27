import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const memoryTypes = [
  { value: 'person', label: 'Person' },
  { value: 'goal', label: 'Goal' },
  { value: 'important_date', label: 'Important Date' },
  { value: 'preference', label: 'Preference' },
  { value: 'life_event', label: 'Life Event' },
  { value: 'reminder', label: 'Reminder' },
];

export default function EditMemoryDialog({ memory, open, onClose, onSave }) {
  const [form, setForm] = useState({ type: 'person', title: '', description: '', date: '', people: '' });

  useEffect(() => {
    if (memory) {
      setForm({
        type: memory.type || 'person',
        title: memory.title || '',
        description: memory.description || '',
        date: memory.date || '',
        people: memory.people?.join(', ') || '',
      });
    }
  }, [memory]);

  const handleSave = () => {
    const peopleArray = form.people ? form.people.split(',').map(p => p.trim()).filter(Boolean) : [];
    onSave({
      ...memory,
      type: form.type,
      title: form.title,
      description: form.description,
      date: form.date,
      people: peopleArray,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Memory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-gray-500">Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {memoryTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Title</Label>
            <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Description</Label>
            <Textarea className="mt-1" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Date</Label>
            <Input className="mt-1" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="e.g. March 12" />
          </div>
          <div>
            <Label className="text-xs text-gray-500">People (comma separated)</Label>
            <Input className="mt-1" value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} placeholder="e.g. Mom, Dad" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="rounded-xl bg-violet-600 hover:bg-violet-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}