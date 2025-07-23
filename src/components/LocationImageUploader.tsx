import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LocationImageUploader({ locationId, accountId, refreshToken, clientId, clientSecret }: {
  locationId: string;
  accountId: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const filePath = `gmb-images/${locationId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('gmb-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('gmb-images').getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get public URL');
      // Download file as base64
      const fileBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      // Post to GMB via Edge Function
      const res = await fetch('/api/gmb/post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          account_id: accountId,
          client_id: clientId,
          client_secret: clientSecret,
          location_id: locationId,
          image_base64: base64,
          file_name: file.name,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post image to GMB');
      setSuccess('Image posted to Google My Business!');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="my-4">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Upload Image to GMB'}
      </button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      {success && <div className="text-green-400 mt-2">{success}</div>}
    </div>
  );
} 