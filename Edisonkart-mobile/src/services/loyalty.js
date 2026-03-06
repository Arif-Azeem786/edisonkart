import client from '../api/client';
const unwrap = (res) => res?.data ?? res;

export const getMyLoyalty = () => client.get('/loyalty').then(unwrap);
export const applyReferral = (code) => client.post('/loyalty/apply-referral', { code }).then(unwrap);
export const redeemPoints = (points) => client.post('/loyalty/redeem', { points }).then(unwrap);
