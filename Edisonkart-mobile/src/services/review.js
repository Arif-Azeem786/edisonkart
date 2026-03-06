import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const getProductReviews = (productId) => client.get(`/reviews/product/${productId}`).then(unwrap);
export const createReview = (reviewData) => client.post('/reviews', reviewData).then(unwrap);
