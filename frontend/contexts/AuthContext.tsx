'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, LoginCredentials, RegisterData, setSelectedUserId } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
			  // Auth should always win for user scoping.
			  setSelectedUserId(currentUser.id);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
			  setSelectedUserId(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const tokenData = await api.login(credentials);
    localStorage.setItem('token', tokenData.access_token);
    const currentUser = await api.getCurrentUser();
    setUser(currentUser);
	setSelectedUserId(currentUser.id);
  };

  const register = async (data: RegisterData) => {
    const newUser = await api.register(data);
    // Auto-login after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
	setSelectedUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
