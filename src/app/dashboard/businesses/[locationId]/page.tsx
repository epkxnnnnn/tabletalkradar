'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LocationDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.locationId as string;
  const { user, profile } = useAuth();
  const [location, setLocation] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qna, setQna] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId || !user || !profile) return;
    const fetchData = async () => {
      setLoading(true);
      // Fetch location info from your API
      const locRes = await fetch(`/api/clients?locationId=${locationId}`);
      const locData = await locRes.json();
      setLocation(locData.clients?.[0] || null);
      // Fetch reviews and Q&A from Edge Functions (replace with real tokens/IDs)
      const gmbRes = await fetch('/api/gmb/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId })
      });
      const gmbData = await gmbRes.json();
      setReviews(gmbData.reviews || []);
      setQna(gmbData.qna || []);
      setLoading(false);
    };
    fetchData();
  }, [locationId, user, profile]);

  if (loading) {
    return <div className="text-white">Loading location dashboard...</div>;
  }

  if (!location) {
    return <div className="text-red-400">Location not found.</div>;
  }

  const canEdit = profile?.role === 'superadmin' || (!!user && location.owner_id === user.id);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-2">{location.business_name}</h1>
      <div className="text-slate-400 mb-6">{location.website}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reviews */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Reviews</h2>
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-200 font-medium">{review.author}</div>
                <div className="text-slate-400 mb-2">{review.comment}</div>
                <div className="text-green-400 text-sm mb-1">Suggested reply: {review.suggested_reply}</div>
                {canEdit && (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs mt-2">Reply</button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* Q&A */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Q&A</h2>
          <ul className="space-y-3">
            {qna.map((item) => (
              <li key={item.id} className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-200 font-medium">Q: {item.question}</div>
                <div className="text-slate-400 mb-2">A: {item.answer}</div>
                {canEdit && (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs mt-2">Answer</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {canEdit && (
        <div className="mt-8">
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">Edit Business Info</button>
        </div>
      )}
    </div>
  );
} 