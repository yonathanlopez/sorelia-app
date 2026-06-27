import React from 'react';
import { Bell, Calendar, Clock, Check } from 'lucide-react';

function DaysBadge({ days }) {
  if (days === null) return null;
  if (days === 0) return <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">Today</span>;
  if (days === 1) return <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">Tomorrow</span>;
  if (days < 0) return <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">Passed</span>;
  return <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{days}d</span>;
}

export default function PreviewCardItem({ item, type = 'default', getDaysUntil, isCompleted = false }) {
  if (type === 'calendar') {
    const rawDate = item.start || item.date || '';
    const dateStr = rawDate.split('T')[0];
    const d = new Date(dateStr + 'T00:00:00');
    const hasTime = rawDate.includes('T');
    const timeStr = hasTime ?
    new Date(rawDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) :
    null;
    const daysUntil = getDaysUntil(dateStr);

    let dateDisplay = null;
    if (daysUntil === 0) {
      dateDisplay = <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
    } else if (daysUntil === 1) {
      dateDisplay = <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
    } else {
      dateDisplay = <div className="w-9 text-center"><p className="text-xs font-semibold text-gray-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p><p className="font-bold text-violet-600 leading-tight text-xs">{d.getDate()}</p></div>;
    }

    return (
      <div className="flex items-center gap-2.5 px-1 py-2">
        <div className="w-0.5 h-7 rounded-full bg-violet-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate text-xs">{item.title || item.summary}</p>
          {timeStr && <span className="text-xs text-gray-400 font-medium">{timeStr}</span>}
        </div>
        {dateDisplay}
      </div>);

  }

  if (type === 'reminder' || type === 'reminders') {
    const hasTime = item.date && item.date.includes('T');
    const timeStr = hasTime ?
    new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) :
    null;
    const daysUntil = getDaysUntil(item.date?.split('T')[0]);

    let dateDisplay = null;
    if (daysUntil === 0) {
      dateDisplay = <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>;
    } else if (daysUntil === 1) {
      dateDisplay = <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Tomorrow</span>;
    } else if (daysUntil !== null && daysUntil > 1) {
      dateDisplay = <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full whitespace-nowrap">{daysUntil}d</span>;
    }

    return (
      <div className="flex items-center gap-2.5 px-1 py-2">
        <div className="w-0.5 h-7 rounded-full bg-amber-100 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate text-xs">{item.title}</p>
          {timeStr && <span className="text-xs text-gray-400 font-medium text-left capitalize">{timeStr}</span>}
        </div>
        {dateDisplay}
      </div>);

  }

  // Today's summary type
  if (type === 'today') {
    const iconMap = { reminders: Bell, calendar: Calendar, recurring: Clock };
    const Icon = iconMap[item.source] || Bell;
    return (
      <div className={`flex items-center gap-2.5 px-1 py-2 ${isCompleted ? 'opacity-50' : ''}`}>
        <Icon className={`w-4 h-4 flex-shrink-0 ${isCompleted ? 'text-gray-300' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-xs ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {item.title || item.summary}
          </p>
          {item.time && <span className={`text-xs ${isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>{item.time}</span>}
        </div>
        {item.onDone &&
        <button
          onClick={(e) => {
            e.stopPropagation();
            item.onDone();
          }}
          disabled={isCompleted}
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-full transition-colors active:scale-90 ${isCompleted ? 'bg-emerald-500' : 'border border-gray-300 hover:border-emerald-500'}`}
          title="Mark done">
          
            {isCompleted && <Check className="w-3 h-3 text-white" />}
          </button>
        }
      </div>);

  }

  return (
    <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-violet-300 flex-shrink-0" />
      <p className="text-xs font-medium flex-1 truncate text-gray-400">
        {item.title || item.summary}
      </p>
      <div className="flex-shrink-0">
        {type === 'coming' ?
        <DaysBadge days={item.daysUntil ?? (item.date ? getDaysUntil(item.date) : null)} /> :
        null}
      </div>
    </div>);

}