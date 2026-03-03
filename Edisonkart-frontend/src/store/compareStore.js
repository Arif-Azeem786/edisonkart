import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCompareStore = create(
  persist(
    (set, get) => ({
      compareItems: [],
      maxItems: 4,

      addToCompare: (product) => {
        const { compareItems, maxItems } = get();
        
        // Check if already in compare
        if (compareItems.find(item => item._id === product._id)) {
          return { success: false, message: "Product already in comparison" };
        }

        // Check max items
        if (compareItems.length >= maxItems) {
          return { success: false, message: `You can only compare up to ${maxItems} products` };
        }

        // Check if same category (optional but recommended for comparison logic)
        if (compareItems.length > 0 && compareItems[0].categoryId?._id !== product.categoryId?._id) {
          // We allow it but maybe warn? Or just allow it for now.
        }

        set({ compareItems: [...compareItems, product] });
        return { success: true, message: "Added to comparison" };
      },

      removeFromCompare: (productId) => {
        set((state) => ({
          compareItems: state.compareItems.filter(item => item._id !== productId)
        }));
      },

      clearCompare: () => {
        set({ compareItems: [] });
      },

      isInCompare: (productId) => {
        return get().compareItems.some(item => item._id === productId);
      }
    }),
    {
      name: 'compare-storage',
    }
  )
);

export default useCompareStore;
