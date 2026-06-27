import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Brain, User, Terminal } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const baseTabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/memories', label: 'Memories', icon: Brain },
  { path: '/profile', label: 'Profile', icon: User },
];

const devTab = { path: '/developer', label: 'Dev', icon: Terminal };

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const tabs = user?.role === 'admin' ? [...baseTabs, devTab] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] tracking-wide ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}