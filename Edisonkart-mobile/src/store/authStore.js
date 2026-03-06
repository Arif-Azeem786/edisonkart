import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../services/auth';

let getStoredTokenFn = () => null;
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const body = await authApi.login(email, password);

          if (body?.success === false) {
            throw new Error(body.message || 'Login failed');
          }

          const payload = body?.data ?? body;
          const user = payload?.user ?? body?.user;
          const token = payload?.token ?? body?.token;

          if (!token) throw new Error('No token received');

          set({
            user,
            token,
            role: user?.role,
            isAuthenticated: true,
          });
        } catch (err) {
          set({ user: null, token: null, role: null, isAuthenticated: false });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          await authApi.register(userData);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        try {
          const body = await authApi.verifyOTP(email, otp);
          const payload = body?.data ?? body;
          const user = payload?.user ?? body?.user;
          const token = payload?.token ?? body?.token;
          if (token && user) {
            set({ user, token, role: user?.role, isAuthenticated: true });
          }
          return body;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({ user: state.user ? { ...state.user, ...userData } : null }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

useAuthStore.subscribe((state) => {
  getStoredTokenFn = () => state.token;
});

export function getStoredToken() {
  return getStoredTokenFn();
}

export default useAuthStore;
