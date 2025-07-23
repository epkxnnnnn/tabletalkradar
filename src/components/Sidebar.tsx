'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { label: 'Businesses', icon: '🏢', path: '/dashboard/businesses' },
  { label: 'Reviews', icon: '⭐', path: '/dashboard/reviews' },
  { label: 'Q&A', icon: '❓', path: '/dashboard/qna' },
  { label: 'Calendar', icon: '🗓️', path: '/dashboard/calendar' },
  { label: 'Integrations', icon: '🔗', path: '/dashboard/integrations' },
  { label: 'Settings', icon: '⚙️', path: '/dashboard/settings' },
];

export default function Sidebar({ activePath }: { activePath?: string }) {
  const router = useRouter();
  return (
    <aside className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-white">
      <div className="h-16 flex items-center justify-center border-b border-slate-800 text-2xl font-bold tracking-tight bg-slate-950">
        <span className="text-red-500">TableTalk</span> <span className="ml-1 text-slate-300">Radar</span>
      </div>
      <nav className="flex-1 py-6 px-2 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left font-medium text-base hover:bg-slate-800 hover:text-red-400 ${activePath === item.path ? 'bg-slate-800 text-red-400' : 'text-slate-200'}`}
          >
            <span className="mr-3 text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <span>Dark Mode</span>
        {/* Add dark mode toggle here if needed */}
      </div>
    </aside>
  );
} 