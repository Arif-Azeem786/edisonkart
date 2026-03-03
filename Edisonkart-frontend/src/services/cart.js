import api from './axios';

export const getCart = () => api.get('/cart').then(res => res.data);
export const addToCart = (productId, quantity, variantId) => api.post('/cart/items', { productId, quantity, variantId }).then(res => res.data);
export const updateCartItem = (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }).then(res => res.data);
export const removeCartItem = (itemId) => api.delete(`/cart/items/${itemId}`).then(res => res.data);
export const clearCart = () => api.delete('/cart').then(res => res.data);
export const applyCoupon = (code) => api.post('/cart/coupon', { code }).then(res => res.data);