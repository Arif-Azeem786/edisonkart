import { create } from 'zustand'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart as clearCartApi } from '../services/cart'

const useCartStore = create((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true })
    try {
      const cart = await getCart()
      set({
        items: cart.items || [],
        total: cart.total || 0,
        itemCount: cart.itemCount || 0
      })
    } catch (error) {
     // console.error('Failed to fetch cart:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (productId, quantity, variantId) => {
    set({ isLoading: true })
    try {
      await addToCart(productId, quantity, variantId)
      // Re-fetch cart to get populated product data
      try {
        const cart = await getCart()
        set({
          items: cart.items || [],
          total: cart.total || 0,
          itemCount: cart.itemCount || 0
        })
      } catch (fetchErr) {
        //console.error('Failed to re-fetch cart after add:', fetchErr)
      }
    } catch (error) {
   //   console.error('Failed to add to cart:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  addItems: async (itemsList) => {
    set({ isLoading: true })
    try {
      // Loop through items and add them sequentially
      // Note: Backend doesn't support batch add yet, so we do it one by one
      for (const item of itemsList) {
        await addToCart(item.productId, item.quantity || 1, item.variantId)
      }
      
      // Re-fetch cart once at the end
      const cart = await getCart()
      set({
        items: cart.items || [],
        total: cart.total || 0,
        itemCount: cart.itemCount || 0
      })
    } catch (error) {
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true })
    try {
      await updateCartItem(itemId, quantity)
      try {
        const cart = await getCart()
        set({
          items: cart.items || [],
          total: cart.total || 0,
          itemCount: cart.itemCount || 0
        })
      } catch (fetchErr) {
        //console.error('Failed to re-fetch cart after update:', fetchErr)
      }
    } catch (error) {
      //console.error('Failed to update cart item:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  removeItem: async (itemId) => {
    set({ isLoading: true })
    try {
      await removeCartItem(itemId)
      try {
        const cart = await getCart()
        set({
          items: cart.items || [],
          total: cart.total || 0,
          itemCount: cart.itemCount || 0
        })
      } catch (fetchErr) {
     //   console.error('Failed to re-fetch cart after remove:', fetchErr)
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  clearCart: async () => {
    set({ isLoading: true })
    try {
      await clearCartApi()
      set({ items: [], total: 0, itemCount: 0 })
    } finally {
      set({ isLoading: false })
    }
  },
}))

export default useCartStore