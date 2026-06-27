import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const RELATIONSHIPS = [
  'Partner', 'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Other'
];

export default function PersonDialog({ memory, open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    birthday: '',
    anniversary: '',
    notes: '',
  });

  useEffect(() => {
    if (memory) {
      // Parse extra fields from description JSON
      let extra = {};
      try { extra = JSON.parse(memory._personMeta || '{}'); } catch {}
      setForm({
        name: memory.title || '',
        relationship: extra.relationship || memory.description?.split('\n')[0] || '',
        birthday: extra.birthday || '',
        anniversary: extra.anniversary || '',
        notes: extra.notes || '',
      });
    } else {
      setForm({ name: '', relationship: '', birthday: '', anniversary: '', notes: '' });
    }
  }, [memory, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const meta = {
      relationship: form.relationship,
      birthday: form.birthday,
      anniversary: form.anniversary,
      notes: form.notes,
    };
    const descParts = [];
    if (form.relationship) descParts.push(form.relationship);
    if (form.birthday) descParts.push(`Birthday: ${form.birthday}`);
    if (form.anniversary) descParts.push(`Anniversary: ${form.anniversary}`);
    if (form.notes) descParts.push(form.notes);

    onSave({
      ...(memory || {}),
      type: 'person',
      title: form.name,
      description: descParts.join(' · '),
      date: form.birthday || '',
      people: [],
      _personMeta: JSON.stringify(meta),
    });
  };

  const showAnniversary = ['Partner', 'Spouse'].includes(form.relationship);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{memory ? 'Edit Person' : 'Add Person'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div>
            <Label className="text-xs text-gray-500">Name *</Label>
            <Input className="mt-1" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
          </div>

          <div>
            <Label className="text-xs text-gray-500">Relationship</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {RELATIONSHIPS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('relationship', form.relationship === r ? '' : r)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.relationship === r
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500">Birthday</Label>
            <Input
              className="mt-1"
              type="date"
              value={form.birthday}
              onChange={e => set('birthday', e.target.value)}
            />
          </div>

          {showAnniversary && (
            <div>
              <Label className="text-xs text-gray-500">Relationship Anniversary</Label>
              <Input
                className="mt-1"
                type="date"
                value={form.anniversary}
                onChange={e => set('anniversary', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-500">Notes</Label>
            <Textarea
              className="mt-1"
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any extra details..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}