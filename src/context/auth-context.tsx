'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

export interface AuthUser {
  creationAt: any;
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export interface AuthContextState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider manages PostgreSQL-based authentication
 * Replaces Firebase authentication with JWT tokens
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const { user: userData } = await response.json();
          setUser(userData);
          // Cache user data for offline access
          if (typeof window !== 'undefined') {
            localStorage.setItem('cached_user', JSON.stringify(userData));
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        // Try to restore from cache if offline
        if (typeof window !== 'undefined') {
          const cachedUser = localStorage.getItem('cached_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              console.log('[Auth] Using cached user data (offline mode)');
            } catch (e) {
              setUser(null);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const { user: userData } = await response.json();
      setUser(userData);

      // Cache user data for offline access
      if (typeof window !== 'undefined') {
        localStorage.setItem('cached_user', JSON.stringify(userData));
      }

      // Trigger cart refresh by dispatching a custom event
      // The cart context will listen for this event to reload the cart from database
      window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { userId: userData.id } }));

      return userData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      const { user: userData } = await response.json();
      setUser(userData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Registration failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const { user: userData } = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const { user: userData } = await response.json();
        setUser(userData);
        return true;
      } else {
        // Refresh failed, user needs to login again
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
      setUser(null);
      return false;
    }
  }, []);

  const contextValue = useMemo<AuthContextState>(
    () => ({
      user,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      refreshToken,
    }),
    [user, isLoading, error, login, register, logout, refreshUser, refreshToken]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Hook to get current authenticated user
 */
export const useCurrentUser = (): AuthUser | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to get auth loading state
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Hook to get auth error
 */
export const useAuthError = (): Error | null => {
  const { error } = useAuth();
  return error;
};
