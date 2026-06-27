import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, User, Target, Plus } from 'lucide-react';
import PeopleSection from '@/components/sorelia/PeopleSection';
import GoalsSection from '@/components/sorelia/GoalsSection';
import DatesSection from '@/components/sorelia/DatesSection';
import EditMemoryDialog from '@/components/sorelia/EditMemoryDialog';
import BottomNav from '@/components/BottomNav';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

const sections = [
  { id: 'people', label: '👥 People', icon: User },
  { id: 'goals', label: '🎯 Goals', icon: Target },
  { id: 'dates', label: '📅 Dates', icon: Calendar },
];

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('people');
  const [editMemory, setEditMemory] = useState(null);
  const [deleteMemory, setDeleteMemory] = useState(null);
  const [addingNew, setAddingNew] = useState(null);
  const { toast } = useToast();

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
        status: updated.status,
      });
      toast({ title: 'Memory updated', duration: 3000 });
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
        status: updated.status || 'active',
        source: 'manual',
      });
      toast({ title: 'Memory saved ✨', duration: 3000 });
    }
    setEditMemory(null);
    setAddingNew(null);
    loadMemories();
  }

  async function handleDelete() {
    await base44.entities.Memory.delete(deleteMemory.id);
    setDeleteMemory(null);
    toast({ title: 'Memory forgotten', duration: 3000 });
    loadMemories();
  }

  async function handleComplete(id) {
    await base44.entities.Memory.update(id, { status: 'completed' });
    toast({ title: 'Goal completed! 🎉', duration: 3000 });
    loadMemories();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const counts = {
    people: memories.filter(m => m.type === 'person').length,
    goals: memories.filter(m => m.type === 'goal').length,
    dates: memories.filter(m => m.type === 'important_date').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">My Memory</h1>
          <span className="text-xs text-gray-400">
            {counts.people + counts.goals + counts.dates} total
          </span>
        </div>

        {/* Section tabs */}
        <div className="flex gap-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeSection === s.id
                  ? 'bg-violet-100 text-violet-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
              <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                {s.id === 'people' ? counts.people : s.id === 'goals' ? counts.goals : counts.dates}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* People */}
        {activeSection === 'people' && (
          <PeopleSection
            memories={memories}
            onAdd={() => setAddingNew('person')}
            onEdit={setEditMemory}
            onDelete={setDeleteMemory}
          />
        )}

        {/* Goals */}
        {activeSection === 'goals' && (
          <GoalsSection
            memories={memories}
            onAdd={() => setAddingNew('goal')}
            onEdit={setEditMemory}
            onDelete={setDeleteMemory}
            onComplete={handleComplete}
          />
        )}

        {/* Dates */}
        {activeSection === 'dates' && (
          <DatesSection
            memories={memories}
            onAdd={() => setAddingNew('important_date')}
            onEdit={setEditMemory}
            onDelete={setDeleteMemory}
          />
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
        open={!!addingNew}
        onClose={() => setAddingNew(null)}
        onSave={handleSave}
        defaultType={addingNew || 'person'}
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