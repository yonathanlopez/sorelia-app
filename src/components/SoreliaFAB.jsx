import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function SoreliaFAB() {
  return (
    <Link
      to="/"
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      title="Chat with Sorelia"
    >
      <Brain className="w-6 h-6 text-white" />
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
    </Link>
  );
}