import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const relationships = ['Friend', 'Partner', 'Spouse', 'Parent', 'Sibling', 'Child', 'Colleague', 'Family', 'Other'];

const defaultForm = {
  type: 'person',
  title: '',
  description: '',
  date: '',
  people: '',
  person_birthday: '',
  person_relationship: '',
  person_anniversary: '',
  date_type: 'custom',
};

export default function EditMemoryDialog({ memory, open, onClose, onSave, defaultType }) {
  const [form, setForm] = useState({ ...defaultForm, type: defaultType || 'person' });

  useEffect(() => {
    if (memory) {
      setForm({
        type: memory.type || 'person',
        title: memory.title || '',
        description: memory.description || '',
        date: memory.date || '',
        people: memory.people?.join(', ') || '',
        person_birthday: memory.person_birthday || '',
        person_relationship: memory.person_relationship || '',
        person_anniversary: memory.person_anniversary || '',
        date_type: memory.date_type || 'custom',
      });
    } else {
      setForm({ ...defaultForm, type: defaultType || 'person' });
    }
  }, [memory, open, defaultType]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    const peopleArray = form.people ? form.people.split(',').map(p => p.trim()).filter(Boolean) : [];
    const payload = {
      ...memory,
      type: form.type,
      title: form.title,
      description: form.description,
      date: form.date,
      people: peopleArray,
    };
    if (form.type === 'person') {
      payload.person_birthday = form.person_birthday;
      payload.person_relationship = form.person_relationship;
      payload.person_anniversary = form.person_anniversary;
    }
    if (form.type === 'important_date') {
      payload.date_type = form.date_type;
    }
    onSave(payload);
  };

  const isPerson = form.type === 'person';
  const isDate = form.type === 'important_date';
  const isGoal = form.type === 'goal';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-lg">{memory ? 'Edit' : 'Add'} Memory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-2 overflow-y-auto flex-1">
          {/* Type selector — only show when creating new */}
          {!memory && (
            <div>
              <Label className="text-xs text-gray-500">Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="goal">Goal</SelectItem>
                    <SelectItem value="important_date">Important Date</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          )}

          {/* Person profile fields */}
          {isPerson ? (
            <>
              <div>
                <Label className="text-xs text-gray-500">Name *</Label>
                <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Relationship</Label>
                <Select value={form.person_relationship} onValueChange={v => set('person_relationship', v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select relationship..." />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Birthday</Label>
                <Input className="mt-1" type="date" value={form.person_birthday} onChange={e => set('person_birthday', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Relationship Anniversary (if applicable)</Label>
                <Input className="mt-1" type="date" value={form.person_anniversary} onChange={e => set('person_anniversary', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Notes</Label>
                <Textarea className="mt-1" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Anything else to remember..." />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs text-gray-500">Title *</Label>
                <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} placeholder={
                  isGoal ? 'e.g. Run a marathon' :
                  isDate ? 'e.g. Mom\'s birthday' :
                  'e.g. Favorite coffee shop'
                } />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <Textarea className="mt-1" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              {(isDate || isGoal) && (
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <Input className="mt-1" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
              )}
              {isDate && (
                <div>
                  <Label className="text-xs text-gray-500">Date Type</Label>
                  <Select value={form.date_type} onValueChange={v => set('date_type', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="bills">Bills</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">People involved (comma separated)</Label>
                <Input className="mt-1" value={form.people} onChange={e => set('people', e.target.value)} placeholder="e.g. Mom, Dad" />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}