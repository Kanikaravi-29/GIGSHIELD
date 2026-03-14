import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'worker' | 'admin';

interface UserData {
  name: string;
  email: string;
  platform: string;
  city: string;
  zone: string;
  dailyIncome: number;
  role: UserRole;
}

interface AuthContextType {
  user: UserData | null;
  login: (data: UserData) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  const login = (data: UserData) => setUser(data);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
