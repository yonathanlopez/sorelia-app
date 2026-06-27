import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

// Centered FAB that sits flush with the bottom nav — no real-estate blocking
export default function SoreliaFAB() {
  return (
    <Link
      to="/"
      className="fixed bottom-[18px] left-1/2 -translate-x-1/2 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
      title="Chat with Sorelia"
    >
      <Brain className="w-6 h-6 text-white" />
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
    </Link>
  );
}