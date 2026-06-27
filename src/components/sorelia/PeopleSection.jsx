import React, { useState } from 'react';
import { User, Plus, Calendar } from 'lucide-react';
import MemoryCard from './MemoryCard';

export default function PeopleSection({ memories, onAdd, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all'); // all, birthdays
  
  const people = memories.filter(m => m.type === 'person');
  const upcoming = people.filter(m => m.person_birthday).sort((a, b) => {
    const aMonth = parseInt(a.person_birthday?.split('-')[1] || '12');
    const bMonth = parseInt(b.person_birthday?.split('-')[1] || '12');
    return aMonth - bMonth;
  });

  const filtered = filter === 'birthdays' ? upcoming : people;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 px-5 -mx-5 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === 'all'
              ? 'text-violet-600 border-violet-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          All People
        </button>
        <button
          onClick={() => setFilter('birthdays')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1 ${
            filter === 'birthdays'
              ? 'text-violet-600 border-violet-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Upcoming Birthdays
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd('person')}
        className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3 rounded-xl mb-4 text-sm font-semibold hover:bg-violet-100 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Person
      </button>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">No people yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <MemoryCard
              key={m.id}
              memory={m}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}