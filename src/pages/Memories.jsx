import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Calendar, User, Target, Heart, Star, Bell, Brain, ArrowLeft, Plus, Search } from 'lucide-react';
import MemoryCard from '@/components/sorelia/MemoryCard';
import EditMemoryDialog from '@/components/sorelia/EditMemoryDialog';
import PersonDialog from '@/components/sorelia/PersonDialog';
import AddMemoryDialog from '@/components/sorelia/AddMemoryDialog';
import BottomNav from '@/components/BottomNav';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

const categories = [
  { type: 'person', label: 'People', icon: User, emoji: '👤', bg: 'bg-blue-50', text: 'text-blue-600' },
  { type: 'goal', label: 'Goals', icon: Target, emoji: '🎯', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { type: 'important_date', label: 'Dates', icon: Calendar, emoji: '📅', bg: 'bg-violet-50', text: 'text-violet-600' },
  { type: 'preference', label: 'Preferences', icon: Heart, emoji: '💜', bg: 'bg-rose-50', text: 'text-rose-600' },
  { type: 'life_event', label: 'Life Events', icon: Star, emoji: '🌟', bg: 'bg-amber-50', text: 'text-amber-600' },
  { type: 'reminder', label: 'Reminders', icon: Bell, emoji: '🔔', bg: 'bg-cyan-50', text: 'text-cyan-600' },
];

export default function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [editMemory, setEditMemory] = useState(null);
  const [editPerson, setEditPerson] = useState(null);
  const [deleteMemory, setDeleteMemory] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type) setSelectedType(type);
  }, []);

  useEffect(() => { loadMemories(); }, []);

  async function loadMemories() {
    const mems = await base44.entities.Memory.list('-created_date', 200);
    setMemories(mems);
    setLoading(false);
  }

  async function handleSave(updated) {
    await base44.entities.Memory.update(updated.id, {
      type: updated.type, title: updated.title,
      description: updated.description, date: updated.date, people: updated.people,
    });
    setEditMemory(null);
    toast({ title: 'Memory updated' });
    loadMemories();
  }

  async function handleSavePerson(data) {
    if (data.id) {
      await base44.entities.Memory.update(data.id, {
        type: 'person', title: data.title, description: data.description, date: data.date, people: [],
      });
      toast({ title: 'Person updated' });
    } else {
      await base44.entities.Memory.create({
        type: 'person', title: data.title, description: data.description, date: data.date, people: [], source: 'manual',
      });
      toast({ title: 'Person added' });
    }
    setEditPerson(null);
    setShowAddPerson(false);
    loadMemories();
  }

  async function handleAddMemory(data) {
    await base44.entities.Memory.create({ ...data, source: 'manual' });
    setShowAdd(false);
    toast({ title: 'Memory saved' });
    loadMemories();
  }

  async function handleDelete() {
    await base44.entities.Memory.delete(deleteMemory.id);
    setDeleteMemory(null);
    toast({ title: 'Memory removed' });
    loadMemories();
  }

  const baseList = selectedType ? memories.filter(m => m.type === selectedType) : memories;
  const filtered = search.trim()
    ? baseList.filter(m =>
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()))
    : baseList;

  const selectedCat = categories.find(c => c.type === selectedType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        {selectedType ? (
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedType(null); setSearch(''); }} className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-[20px] text-gray-900">{selectedCat?.label}</h1>
              <p className="text-[12px] text-gray-400 mt-0.5">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</p>
            </div>
            <button
              onClick={() => selectedType === 'person' ? setShowAddPerson(true) : setShowAdd(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold bg-gray-900 text-white px-4 py-2 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        ) : (
          <div>
            <h1 className="font-bold text-[22px] text-gray-900">Memories</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{memories.length} total</p>
          </div>
        )}

        {/* Search */}
        {selectedType && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${selectedCat?.label?.toLowerCase()}…`}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none"
            />
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {!selectedType ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(c => {
              const count = memories.filter(m => m.type === c.type).length;
              return (
                <button
                  key={c.type}
                  onClick={() => setSelectedType(c.type)}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl text-left shadow-sm border border-gray-100 active:scale-[0.97] transition-transform"
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{c.emoji}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                    <p className="text-[11px] text-gray-400">{count} saved</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">{selectedCat?.emoji}</div>
              <p className="text-[15px] font-semibold text-gray-800">Nothing here yet</p>
              <p className="text-[13px] text-gray-400 mt-1.5">Start adding {selectedCat?.label?.toLowerCase()} to remember.</p>
              <button
                onClick={() => selectedType === 'person' ? setShowAddPerson(true) : setShowAdd(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-semibold rounded-full"
              >
                <Plus className="w-4 h-4" />
                Add {selectedCat?.label?.slice(0, -1) || 'Memory'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(m => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  onEdit={m.type === 'person' ? () => setEditPerson(m) : setEditMemory}
                  onDelete={setDeleteMemory}
                />
              ))}
            </div>
          )
        )}
      </div>

      <EditMemoryDialog memory={editMemory} open={!!editMemory} onClose={() => setEditMemory(null)} onSave={handleSave} />
      <AddMemoryDialog type={selectedType} open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddMemory} />
      <PersonDialog memory={editPerson} open={!!editPerson} onClose={() => setEditPerson(null)} onSave={handleSavePerson} />
      <PersonDialog memory={null} open={showAddPerson} onClose={() => setShowAddPerson(false)} onSave={handleSavePerson} />

      <AlertDialog open={!!deleteMemory} onOpenChange={() => setDeleteMemory(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Forget this?</AlertDialogTitle>
            <AlertDialogDescription>"{deleteMemory?.title}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}