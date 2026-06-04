import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataService, clearSessionUser, getSessionUser, setSessionUser, type DBUser } from '../services/db';

interface AuthContextValue {
  user: DBUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => void;
  signup: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    birthday: string;
    gender: string;
    height?: number;
    weight?: number;
    experience?: string;
    goal?: string;
  }) => void;
  logout: () => void;
  updateUser: (updates: Partial<Omit<DBUser, 'id' | 'username' | 'email' | 'password' | 'createdAt'>>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    DataService.initialize();
    const sessionUserId = getSessionUser();
    if (sessionUserId) {
      const existingUser = DataService.getUserById(sessionUserId);
      if (existingUser) {
        setUser(existingUser);
      } else {
        clearSessionUser();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (identifier: string, password: string) => {
    const existingUser = DataService.validateCredentials(identifier, password);
    if (!existingUser) {
      throw new Error('Invalid username or password.');
    }

    setSessionUser(existingUser.id);
    setUser(existingUser);
  };

  const signup = (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    birthday: string;
    gender: string;
    height?: number;
    weight?: number;
    experience?: string;
    goal?: string;
  }) => {
    const newUser = DataService.createUser(payload);
    setSessionUser(newUser.id);
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    clearSessionUser();
  };

  const updateUser = (updates: Partial<Omit<DBUser, 'id' | 'username' | 'email' | 'password' | 'createdAt'>>) => {
    if (!user) return;
    const updatedUser = DataService.updateUserSettings(user.id, updates);
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
