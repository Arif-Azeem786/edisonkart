import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const getCart = () => client.get('/cart').then(unwrap);
export const addToCart = (productId, quantity, variantId) =>
  client.post('/cart/items', { productId, quantity, variantId }).then(unwrap);
export const updateCartItem = (itemId, quantity) =>
  client.put(`/cart/items/${itemId}`, { quantity }).then(unwrap);
export const removeCartItem = (itemId) => client.delete(`/cart/items/${itemId}`).then(unwrap);
export const clearCart = () => client.delete('/cart').then(unwrap);
export const applyCoupon = (code) => client.post('/cart/coupon', { code }).then(unwrap);
