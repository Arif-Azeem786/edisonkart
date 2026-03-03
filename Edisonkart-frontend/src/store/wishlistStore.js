import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getWishlist as fetchWishlistApi, toggleWishlist as toggleWishlistApi } from '../services/wishlist';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      isLoading: false,
      error: null,

      fetchWishlist: async () => {
        set({ isLoading: true });
        try {
          const response = await fetchWishlistApi();
          // response is the full body { success, message, data }
          set({ wishlist: response.data?.products || [], isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      toggleWishlist: async (productId) => {
        try {
          const response = await toggleWishlistApi(productId);
          // response is the full body { success, message, data }
          
          await get().fetchWishlist();
          return response.message;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      isInWishlist: (productId) => {
        return get().wishlist.some(p => p._id === productId);
      },

      clearWishlist: () => set({ wishlist: [] })
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useWishlistStore;
