'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';

const metricsConfig = [
  { label: 'Businesses', key: 'businesses', color: 'bg-blue-600' },
  { label: 'Reviews', key: 'reviews', color: 'bg-yellow-500' },
  { label: 'Q&A', key: 'qna', color: 'bg-pink-500' },
  { label: 'Scheduled Posts', key: 'scheduled', color: 'bg-green-600' },
  { label: 'Integrations', key: 'integrations', color: 'bg-purple-600' },
];

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState<Record<string, number>>({
    businesses: 0,
    reviews: 0,
    qna: 0,
    scheduled: 0,
    integrations: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch metrics and recent activity (mocked for now)
    setMetrics({
      businesses: 5,
      reviews: 120,
      qna: 8,
      scheduled: 3,
      integrations: 2,
    });
    setRecent([
      { type: 'Review', text: 'New review for Pizza Place', time: '2m ago' },
      { type: 'Audit', text: 'Audit completed for Coffee Bar', time: '10m ago' },
      { type: 'Q&A', text: 'New question on Burger Joint', time: '1h ago' },
      { type: 'Post', text: 'Scheduled post for Sushi House', time: '2h ago' },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {metricsConfig.map((m) => (
          <div key={m.key} className={`rounded-xl shadow-md p-6 flex flex-col items-center ${m.color} text-white`}>
            <div className="text-3xl font-bold mb-2">{metrics[m.key]}</div>
            <div className="text-lg font-medium">{m.label}</div>
          </div>
        ))}
      </div>
      {/* Main Content: Recent Activity & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="md:col-span-2 bg-[#232c3b] rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ul className="divide-y divide-gray-700">
            {recent.map((item, i) => (
              <li key={i} className="py-3 flex items-center gap-4">
                <span className="text-sm font-bold text-gray-300 w-20">{item.type}</span>
                <span className="flex-1 text-gray-100">{item.text}</span>
                <span className="text-xs text-gray-400">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Performance Chart Placeholder */}
        <div className="bg-[#232c3b] rounded-xl p-6 shadow-md flex flex-col items-center justify-center min-h-[260px]">
          <h2 className="text-xl font-semibold mb-4">Performance Chart</h2>
          <div className="w-full h-40 flex items-center justify-center text-gray-400">
            {/* Replace with real chart later */}
            <span>Chart coming soon...</span>
          </div>
        </div>
      </div>
    </div>
  );
} 