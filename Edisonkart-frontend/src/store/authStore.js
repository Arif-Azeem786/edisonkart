import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as apiLogin, register as apiRegister, verifyOTP as apiVerifyOTP } from '../services/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      
      fetchUser: async () => {
        try {
          // Import here to avoid circular dependency if any, though service import is fine at top
          // Assuming getProfile returns the user object
          const { getProfile } = await import('../services/user');
          const userData = await getProfile();
          set(state => ({ 
            user: { ...state.user, ...userData },
            isAuthenticated: true 
          }));
        } catch (error) {
           //console.error("Failed to fetch user profile", error);
        }
      },

      login: async (emailOrToken, password) => {
        set({ isLoading: true });
        try {
          if (typeof emailOrToken === 'object' && emailOrToken?.token && emailOrToken?.user) {
            const { token, user } = emailOrToken;
            set({ user, token, role: user?.role, isAuthenticated: true });
          } else {
            const data = await apiLogin(emailOrToken, password);
            set({ user: data.user, token: data.token, role: data.user.role, isAuthenticated: true });
          }
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          await apiRegister(userData);
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        try {
          await apiVerifyOTP(email, otp);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;