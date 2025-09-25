import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  studentId?: string;
  teacherId?: string;
  role: 'student' | 'teacher' | 'admin';
  isApproved: boolean;
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
  setStudentId: (studentId: string) => void;
  setTeacherId: (teacherId: string) => void;
  approveUser: () => void;
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

      setStudentId: (studentId: string) => set((state) => ({
        user: state.user ? { ...state.user, studentId, role: 'student' } : null
      })),

      setTeacherId: (teacherId: string) => set((state) => ({
        user: state.user ? { ...state.user, teacherId, role: 'teacher' } : null
      })),

      approveUser: () => set((state) => ({
        user: state.user ? { ...state.user, isApproved: true } : null
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
