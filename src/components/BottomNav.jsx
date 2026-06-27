import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Home, User, Brain } from 'lucide-react';
import SoreliaFAB from './SoreliaFAB';

const leftTabs = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
];
const rightTabs = [
  { path: '/memories', label: 'Memories', icon: Home },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  const tabClass = (path) => {
    const active = location.pathname === path;
    return `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
      active ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
    }`;
  };

  const iconClass = (path) => location.pathname === path ? 'stroke-[2.5]' : 'stroke-[1.8]';
  const labelClass = (path) => `text-[10px] tracking-wide ${location.pathname === path ? 'font-semibold' : 'font-medium'}`;

  return (
    <>
      <SoreliaFAB />
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around w-full h-16">
          {leftTabs.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={tabClass(path)}>
              <Icon className={`w-5 h-5 ${iconClass(path)}`} />
              <span className={labelClass(path)}>{label}</span>
            </Link>
          ))}

          {/* Center spacer for FAB */}
          <div className="min-w-[56px]" />

          {rightTabs.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={tabClass(path)}>
              <Icon className={`w-5 h-5 ${iconClass(path)}`} />
              <span className={labelClass(path)}>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}