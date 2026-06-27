import React from 'react';
import { Calendar, User, Target, Heart, Star, Bell, Pencil, Trash2 } from 'lucide-react';

const typeConfig = {
  person: { icon: User, color: 'bg-blue-50 text-blue-600', label: 'Person' },
  goal: { icon: Target, color: 'bg-emerald-50 text-emerald-600', label: 'Goal' },
  important_date: { icon: Calendar, color: 'bg-violet-50 text-violet-600', label: 'Date' },
  preference: { icon: Heart, color: 'bg-rose-50 text-rose-600', label: 'Preference' },
  life_event: { icon: Star, color: 'bg-amber-50 text-amber-600', label: 'Life Event' },
  reminder: { icon: Bell, color: 'bg-cyan-50 text-cyan-600', label: 'Reminder' },
};

export default function MemoryCard({ memory, onEdit, onDelete }) {
  const config = typeConfig[memory.type] || typeConfig.person;
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{memory.title}</h3>
            {memory.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{memory.description}</p>
            )}
            {memory.date && (
              <p className="text-xs text-violet-600 mt-1 font-medium">{memory.date}</p>
            )}
            {memory.people?.length > 0 && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {memory.people.map((p, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(memory)} className="p-1.5 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(memory)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}