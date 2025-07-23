'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { label: 'Businesses', icon: '🏢', path: '/dashboard/businesses' },
  { label: 'Reviews', icon: '⭐', path: '/reviews' },
  { label: 'Q&A', icon: '❓', path: '/qna' },
  { label: 'Calendar', icon: '📅', path: '/calendar' },
  { label: 'Integrations', icon: '🔗', path: '/integrations' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-[#181f2a] text-white w-64 min-h-screen flex flex-col border-r border-gray-800">
      <div className="h-16 flex items-center justify-center text-2xl font-bold tracking-tight border-b border-gray-800">
        <span className="text-red-500">Table</span>Talk <span className="text-gray-400 ml-1">Radar</span>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <Link href={item.path} className={`flex items-center px-6 py-3 rounded-lg transition-colors duration-150 cursor-pointer font-medium text-base gap-3
                  ${isActive ? 'bg-[#232c3b] text-red-400' : 'hover:bg-[#232c3b] text-gray-200'}`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto p-4 text-xs text-gray-500 text-center">
        <span className="opacity-60">Dark Mode</span>
      </div>
    </aside>
  );
} 