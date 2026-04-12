import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, usersApi, type AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('ribbion_token');
      if (!token) {
        setUser(null);
        return;
      }
      const profile = await usersApi.getMe();
      setUser(profile as unknown as AuthUser);
    } catch {
      localStorage.removeItem('ribbion_token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (usernameOrEmail: string, password: string) => {
    const data = await authApi.login({ usernameOrEmail, password });
    localStorage.setItem('ribbion_token', data.accessToken);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    const data = await authApi.register({ username, email, password, displayName });
    localStorage.setItem('ribbion_token', data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('ribbion_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
