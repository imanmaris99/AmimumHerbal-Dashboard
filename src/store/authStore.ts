import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

const SESSION_TIMEOUT_MS = 1000 * 60 * 60 * 4;

interface AuthStore {
  user: User | null;
  token: string | null;
  lastActivityAt: number | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  touchSession: () => void;
  isSessionExpired: () => boolean;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      lastActivityAt: null,
      setAuth: (user, token) => set({ user, token, lastActivityAt: Date.now() }),
      updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
      logout: () => set({ user: null, token: null, lastActivityAt: null }),
      touchSession: () => {
        if (!get().token || !get().user) return;
        set({ lastActivityAt: Date.now() });
      },
      isSessionExpired: () => {
        const lastActivityAt = get().lastActivityAt;
        if (!lastActivityAt) return true;
        return Date.now() - lastActivityAt > SESSION_TIMEOUT_MS;
      },
      isAuthenticated: () => {
        const state = get();
        if (!state.token || !state.user) {
          return false;
        }
        if (state.isSessionExpired()) {
          set({ user: null, token: null, lastActivityAt: null });
          return false;
        }
        return true;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
