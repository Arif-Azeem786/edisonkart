import api from './axios';
export const getMyLoyalty = () => api.get('/loyalty').then(res => res.data);
export const applyReferral = (code) => api.post('/loyalty/apply-referral', { code }).then(res => res.data);
export const redeemPoints = (points) => api.post('/loyalty/redeem', { points }).then(res => res.data);
