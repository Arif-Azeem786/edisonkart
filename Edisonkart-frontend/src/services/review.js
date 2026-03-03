import api from './axios';

export const getProductReviews = (productId) => api.get(`/reviews/product/${productId}`).then(res => res.data);
export const createReview = (reviewData) => api.post('/reviews', reviewData).then(res => res.data);
