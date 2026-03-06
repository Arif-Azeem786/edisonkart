import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const getWishlist = () => client.get('/wishlist').then(unwrap);
export const toggleWishlist = (productId) => client.post('/wishlist/toggle', { productId }).then(unwrap);
