import api from './axios';

export const getWishlist = () => api.get('/wishlist');
export const toggleWishlist = (productId) => api.post('/wishlist/toggle', { productId });
