import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  email: string;
  name: string;
  studentId: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessToken?: string;
  googleAccessToken?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  setGoogleToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user: User) => set({ 
        user, 
        isAuthenticated: true, 
        error: null 
      }),

      setGoogleToken: (token: string) => set((state) => ({
        user: state.user ? { ...state.user, googleAccessToken: token } : null
      })),

      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        error: null 
      }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
