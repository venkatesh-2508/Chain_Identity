import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS = [
  {
    role: 'ADMINISTRATOR' as UserRole,
    name: 'System Administrator',
    email: 'admin@chainidentity.demo',
    password: 'admin123',
    did: 'did:chainidentity:admin001',
    description: 'Create users, generate DIDs, register and tokenize assets, allocate permissions',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    role: 'SECURITY_MANAGER' as UserRole,
    name: 'Vikram Joshi (SecOps)',
    email: 'security@chainidentity.demo',
    password: 'security123',
    did: 'did:chainidentity:sec001',
    description: 'Review access requests, revoke permissions, monitor AI security anomalies, break-glass',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    role: 'EMPLOYEE' as UserRole,
    name: 'Rahul Kumar',
    email: 'rahul@chainidentity.demo',
    password: 'rahul123',
    did: 'did:chainidentity:rahul123',
    description: 'Tactical Defense Engineer: view DID, test asset access (ALLOW/DENY), request access',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'AUDITOR' as UserRole,
    name: 'Dr. Ananya Roy',
    email: 'auditor@chainidentity.demo',
    password: 'auditor123',
    did: 'did:chainidentity:aud001',
    description: 'Read-only audit explorer: verify blockchain SHA-256 hash integrity and timeline',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('chainidentity_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('chainidentity_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('chainidentity_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('chainidentity_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('chainidentity_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (targetRole: UserRole) => {
    const demo = DEMO_USERS.find((d) => d.role === targetRole);
    if (demo) {
      await login(demo.email, demo.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
