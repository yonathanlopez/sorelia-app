import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, User, Target, Heart, Star, Bell, Brain, ArrowLeft, Plus } from 'lucide-react';
import MemoryCard from '@/components/sorelia/MemoryCard';
import EditMemoryDialog from '@/components/sorelia/EditMemoryDialog';
import BottomNav from '@/components/BottomNav';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

const categories = [
  { type: 'person', label: 'People', icon: User, color: 'bg-blue-100 text-blue-600' },
  { type: 'goal', label: 'Goals', icon: Target, color: 'bg-emerald-100 text-emerald-600' },
  { type: 'important_date', label: 'Important Dates', icon: Calendar, color: 'bg-violet-100 text-violet-600' },
  { type: 'preference', label: 'Preferences', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { type: 'life_event', label: 'Life Events', icon: Star, color: 'bg-amber-100 text-amber-600' },
  { type: 'reminder', label: 'Reminders', icon: Bell, color: 'bg-cyan-100 text-cyan-600' },
];

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [editMemory, setEditMemory] = useState(null);
  const [deleteMemory, setDeleteMemory] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const { toast } = useToast();

  // Check URL for type filter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setSelectedType(type);
  }, []);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    const mems = await base44.entities.Memory.list('-created_date', 200);
    setMemories(mems);
    setLoading(false);
  }

  async function handleSave(updated) {
    if (updated.id) {
      await base44.entities.Memory.update(updated.id, {
        type: updated.type,
        title: updated.title,
        description: updated.description,
        date: updated.date,
        people: updated.people,
        person_birthday: updated.person_birthday,
        person_relationship: updated.person_relationship,
        person_anniversary: updated.person_anniversary,
      });
      toast({ title: 'Memory updated' });
    } else {
      await base44.entities.Memory.create({
        type: updated.type,
        title: updated.title,
        description: updated.description,
        date: updated.date,
        people: updated.people,
        person_birthday: updated.person_birthday,
        person_relationship: updated.person_relationship,
        person_anniversary: updated.person_anniversary,
        source: 'manual',
      });
      toast({ title: 'Memory saved ✨' });
    }
    setEditMemory(null);
    setAddingNew(false);
    loadMemories();
  }

  async function handleDelete() {
    await base44.entities.Memory.delete(deleteMemory.id);
    setDeleteMemory(null);
    toast({ title: 'Memory forgotten' });
    loadMemories();
  }

  const filtered = selectedType ? memories.filter(m => m.type === selectedType) : memories;
  const selectedCat = categories.find(c => c.type === selectedType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        {selectedType ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedType(null)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              {selectedCat && <selectedCat.icon className="w-5 h-5 text-violet-600" />}
              <h1 className="font-semibold text-gray-900 text-lg">{selectedCat?.label || 'Memories'}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-400">{filtered.length}</span>
              <button
                onClick={() => setAddingNew(true)}
                className="flex items-center gap-1 bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-violet-600" />
            <h1 className="font-semibold text-gray-900 text-lg">Memories</h1>
            <span className="ml-auto text-sm text-gray-400">{memories.length} total</span>
          </div>
        )}
      </div>

      <div className="px-5 pt-4">
        {/* Category grid (when no type selected) */}
        {!selectedType && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {categories.map(c => {
              const count = memories.filter(m => m.type === c.type).length;
              const Icon = c.icon;
              return (
                <button
                  key={c.type}
                  onClick={() => setSelectedType(c.type)}
                  className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-md ${c.color.split(' ')[0]} border border-transparent hover:border-gray-200`}
                >
                  <Icon className={`w-5 h-5 ${c.color.split(' ')[1]}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                    <p className="text-xs text-gray-500">{count} saved</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Memory list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Brain className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No memories here yet</p>
            <p className="text-xs text-gray-400 mt-1">Chat with Sorelia to start saving memories</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <MemoryCard
                key={m.id}
                memory={m}
                onEdit={setEditMemory}
                onDelete={setDeleteMemory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <EditMemoryDialog
        memory={editMemory}
        open={!!editMemory}
        onClose={() => setEditMemory(null)}
        onSave={handleSave}
      />

      {/* Add new dialog */}
      <EditMemoryDialog
        memory={null}
        open={addingNew}
        onClose={() => setAddingNew(false)}
        onSave={handleSave}
        defaultType={selectedType || 'person'}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteMemory} onOpenChange={() => setDeleteMemory(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Forget this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteMemory?.title}" will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">
              Forget this
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}