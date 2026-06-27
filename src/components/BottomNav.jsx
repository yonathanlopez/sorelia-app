import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, Brain, MessageCircle, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/memories', label: 'Memories', icon: Brain },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-gray-900 -mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}