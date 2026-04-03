import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'worker' | 'provider' | 'admin';

export interface UserData {
  id: string;
  name: string;
  email: string;
  platform?: string;
  platformId?: string;
  platformRegistrationNumber?: string;
  adminType?: string;
  status?: string;
  city?: string;
  zone?: string;
  dailyIncome?: number;
  role: UserRole;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  login: (userData: UserData, userToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed parsing user session", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: UserData, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
