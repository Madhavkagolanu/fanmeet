'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile, Creator } from '@/types';
import { getCreatorByUserId, upsertCreatorProfile, upsertProfile } from '@/lib/supabase/db';

interface AuthContextType {
  user: Profile | null;
  creator: Creator | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateCreatorProfile: (creatorData: Partial<Creator>) => Promise<Creator>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncUserProfile = async (sessionUser: any): Promise<Profile> => {
    const profile: Profile = {
      id: sessionUser.id,
      name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Fanmeet User',
      email: sessionUser.email || '',
      avatar_url: sessionUser.user_metadata?.avatar_url || '',
      phone_number: sessionUser.phone || '',
      created_at: sessionUser.created_at || new Date().toISOString(),
    };

    // Non-blocking upsert to Supabase profiles
    upsertProfile(profile).catch((err) => {
      console.warn('Profile sync notice:', err);
    });

    return profile;
  };

  const loadUserAndCreator = async (sessionUser: any) => {
    const profile = await syncUserProfile(sessionUser);
    setUser(profile);

    try {
      const creatorData = await getCreatorByUserId(sessionUser.id);
      setCreator(creatorData);
    } catch (err) {
      console.error('Error fetching creator data:', err);
      setCreator(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserAndCreator(session.user);
      } else {
        setUser(null);
        setCreator(null);
      }
    } catch (e) {
      console.error('Error refreshing auth:', e);
    }
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserAndCreator(session.user);
      } else {
        setUser(null);
        setCreator(null);
      }
      setIsLoading(false);
    });

    // Listen to real-time Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserAndCreator(session.user);
      } else {
        setUser(null);
        setCreator(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });

    if (error) {
      console.error('Google Sign In error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCreator(null);
  };

  const updateCreator = async (creatorData: Partial<Creator>): Promise<Creator> => {
    if (!user) {
      throw new Error('You must be signed in to configure your creator page.');
    }

    // Ensure the profile row exists in DB before linking creator
    await upsertProfile({
      id: user.id,
      name: creatorData.display_name || user.name,
      email: user.email,
      avatar_url: creatorData.avatar_url || user.avatar_url || '',
      phone_number: user.phone_number || '',
    });

    const handle = (creatorData.handle || user.name.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();

    const savedCreator = await upsertCreatorProfile({
      user_id: user.id,
      handle: handle,
      display_name: creatorData.display_name || user.name,
      bio: creatorData.bio || 'Creator hosting fanmeets & jams.',
      avatar_url: creatorData.avatar_url || user.avatar_url || '',
      is_active: true,
      social_links: creatorData.social_links || {
        insta: '',
        fb: '',
        x: '',
        linkedin: '',
        youtube: '',
      },
    });

    setCreator(savedCreator);
    return savedCreator;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        creator,
        isLoading,
        signInWithGoogle,
        signOut,
        updateCreatorProfile: updateCreator,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
