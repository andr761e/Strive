import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataService, clearSessionUser, getSessionUser, setSessionUser, type DBUser } from '../services/db';

interface AuthContextValue {
  user: DBUser | null;
  profiles: DBUser[];
  isLoading: boolean;
  createProfile: (payload: {
    username: string;
    birthday: string;
    gender: string;
    height?: number;
    weight?: number;
    experience?: string;
    goal?: string;
  }) => void;
  switchProfile: (userId: string) => void;
  deleteProfile: () => DBUser | null;
  updateUser: (updates: Partial<Omit<DBUser, 'id' | 'createdAt'>>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  const [profiles, setProfiles] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initializeProfiles = async () => {
      await DataService.initialize();
      if (cancelled) return;

      const localProfiles = DataService.getUsers();
      setProfiles(localProfiles);
      const sessionUserId = getSessionUser();
      if (sessionUserId) {
        const existingUser = DataService.getUserById(sessionUserId);
        if (existingUser) {
          setUser(existingUser);
        } else {
          clearSessionUser();
          if (localProfiles.length === 1) {
            setSessionUser(localProfiles[0].id);
            setUser(localProfiles[0]);
          }
        }
      } else if (localProfiles.length === 1) {
        setSessionUser(localProfiles[0].id);
        setUser(localProfiles[0]);
      }
      setIsLoading(false);
    };

    void initializeProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const createProfile = (payload: {
    username: string;
    birthday: string;
    gender: string;
    height?: number;
    weight?: number;
    experience?: string;
    goal?: string;
  }) => {
    const newUser = DataService.createLocalProfile(payload);
    setSessionUser(newUser.id);
    setUser(newUser);
    setProfiles(DataService.getUsers());
  };

  const switchProfile = (userId: string) => {
    const nextProfile = DataService.getUserById(userId);
    if (!nextProfile) {
      throw new Error('That local profile could not be found.');
    }
    setSessionUser(nextProfile.id);
    setUser(nextProfile);
  };

  const deleteProfile = () => {
    if (user) {
      DataService.deleteUserProfile(user.id);
    }
    const remainingProfiles = DataService.getUsers();
    const nextProfile = remainingProfiles[0] ?? null;
    setProfiles(remainingProfiles);
    setUser(nextProfile);
    if (nextProfile) {
      setSessionUser(nextProfile.id);
    } else {
      clearSessionUser();
    }
    return nextProfile;
  };

  const updateUser = (updates: Partial<Omit<DBUser, 'id' | 'createdAt'>>) => {
    if (!user) return;
    const updatedUser = DataService.updateUserSettings(user.id, updates);
    if (updatedUser) {
      setUser(updatedUser);
      setProfiles(DataService.getUsers());
    }
  };

  const value = useMemo(
    () => ({
      user,
      profiles,
      isLoading,
      createProfile,
      switchProfile,
      deleteProfile,
      updateUser,
    }),
    [user, profiles, isLoading],
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
