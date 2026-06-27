import React, { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import MemoryCard from './MemoryCard';

export default function GoalsSection({ memories, onAdd, onEdit, onDelete, onComplete }) {
  const [filter, setFilter] = useState('active'); // active, completed
  
  const goals = memories.filter(m => m.type === 'goal');
  const active = goals.filter(m => m.status !== 'completed');
  const completed = goals.filter(m => m.status === 'completed');

  const filtered = filter === 'active' ? active : completed;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 px-5 -mx-5 mb-4">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === 'active'
              ? 'text-violet-600 border-violet-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Active Goals
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === 'completed'
              ? 'text-violet-600 border-violet-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd('goal')}
        className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3 rounded-xl mb-4 text-sm font-semibold hover:bg-violet-100 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Goal
      </button>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-500">
            {filter === 'active' ? 'No active goals yet' : 'No completed goals yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <MemoryCard
              key={m.id}
              memory={m}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={filter === 'active' ? onComplete : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}