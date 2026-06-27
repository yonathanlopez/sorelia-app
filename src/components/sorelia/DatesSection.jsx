import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import MemoryCard from './MemoryCard';

export default function DatesSection({ memories, onAdd, onEdit, onDelete }) {
  const [dateType, setDateType] = useState('all');
  
  const dates = memories.filter(m => m.type === 'important_date').sort((a, b) => {
    const aDate = new Date(a.date || '9999-12-31');
    const bDate = new Date(b.date || '9999-12-31');
    return aDate - bDate;
  });

  const filtered = dateType === 'all' 
    ? dates 
    : dates.filter(d => (d.date_type || 'custom') === dateType);
  
  const dateTypes = ['all', 'birthday', 'anniversary', 'bills', 'custom'];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 px-5 -mx-5 mb-4 overflow-x-auto">
        {dateTypes.map(type => (
          <button
            key={type}
            onClick={() => setDateType(type)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap capitalize ${
              dateType === type
                ? 'text-violet-600 border-violet-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd('important_date')}
        className="w-full flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3 rounded-xl mb-4 text-sm font-semibold hover:bg-violet-100 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Date
      </button>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-violet-600" />
          </div>
          <p className="text-sm text-gray-500">
            No {dateType === 'all' ? 'dates' : dateType} dates yet
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
            />
          ))}
        </div>
      )}
    </div>
  );
}