"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  email: string;
  displayName?: string;
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string) => void;
  signOut: () => void;
  isHydrated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'luxefinds_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user, isHydrated]);

  const signIn = (email: string) => {
    const u = { email, displayName: email.split('@')[0] };
    setUser(u);
    // TODO: replace with Firebase Auth:
    // signInWithEmailAndPassword(auth, email, password)
  };

  const signOut = () => setUser(null);

  return <AuthContext.Provider value={{ user, signIn, signOut, isHydrated }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
