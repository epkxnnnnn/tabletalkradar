'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// import { fetchProfile } from '@/lib/supabase';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Get current auth user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  // Fetch profile data after user is loaded
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // TODO: Implement profile fetching logic here or import the correct function.
        // For now, setProfile to null or handle accordingly.
        setProfile(null);
      } catch (err: any) {
        console.error('Profile loading error:', {
          message: err?.message,
          stack: err?.stack,
          raw: JSON.stringify(err, null, 2),
        });
      }
    };

    fetchData();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);