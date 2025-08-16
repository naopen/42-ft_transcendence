import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  locale: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateLocale: (locale: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true,

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/verify');
      if (response.data.authenticated) {
        set({
          isAuthenticated: true,
          user: response.data.user,
          loading: false,
        });
        return true;
      } else {
        set({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      set({
        isAuthenticated: false,
        user: null,
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  updateLocale: async (locale: string) => {
    try {
      await api.patch('/users/me/locale', { locale });
      set((state) => ({
        user: state.user ? { ...state.user, locale } : null,
      }));
    } catch (error) {
      console.error('Update locale error:', error);
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));
