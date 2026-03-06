import { create } from 'zustand';
import * as cartApi from '../services/cart';

const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.getCart();
      const data = cart?.data ?? cart;
      const items = data?.items ?? [];
      const total = data?.total ?? 0;
      const itemCount = data?.itemCount ?? items.length;
      set({ items, total, itemCount });
    } catch (_) {}
    finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1, variantId) => {
    set({ isLoading: true });
    try {
      await cartApi.addToCart(productId, quantity, variantId);
      const cart = await cartApi.getCart();
      const data = cart?.data ?? cart;
      set({
        items: data?.items ?? [],
        total: data?.total ?? 0,
        itemCount: data?.itemCount ?? 0,
      });
    } catch (e) {
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      await cartApi.updateCartItem(itemId, quantity);
      const cart = await cartApi.getCart();
      const data = cart?.data ?? cart;
      set({ items: data?.items ?? [], total: data?.total ?? 0, itemCount: data?.itemCount ?? 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true });
    try {
      await cartApi.removeCartItem(itemId);
      const cart = await cartApi.getCart();
      const data = cart?.data ?? cart;
      set({ items: data?.items ?? [], total: data?.total ?? 0, itemCount: data?.itemCount ?? 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clearCart();
      set({ items: [], total: 0, itemCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useCartStore;
