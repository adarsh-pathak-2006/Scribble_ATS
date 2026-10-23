'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { Profile, AuthTokens } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: Profile | null;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: { username: string; email: string; first_name?: string; last_name?: string; phone_number?: string }) => Promise<{ sessionId: string; debugOtp?: string }>;
  verifyOtp: (sessionId: string, otp: string) => Promise<void>;
  setPassword: (sessionId: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = async () => {
    try {
      const p = await api.getProfile();
      setProfile(p);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setProfile(null);
      api.clearTokens();
    }
  };

  useEffect(() => {
    const access = localStorage.getItem('access_token');
    if (access) {
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const tokens: AuthTokens = await api.login({ username, password });
      api.setTokens(tokens);
      await fetchProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { username: string; email: string; first_name?: string; last_name?: string; phone_number?: string }) => {
    const res = await api.register(payload);
    return { sessionId: res.session_id, debugOtp: res.debug_otp };
  };

  const verifyOtp = async (sessionId: string, otp: string) => {
    await api.verifyOtp(sessionId, otp);
  };

  const setPassword = async (sessionId: string, password: string) => {
    await api.setPassword(sessionId, password);
  };

  const logout = () => {
    api.clearTokens();
    setIsAuthenticated(false);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        profile,
        login,
        register,
        verifyOtp,
        setPassword,
        logout,
        refreshProfile: fetchProfile,
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
