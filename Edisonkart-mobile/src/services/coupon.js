import client from '../api/client';
const unwrap = (res) => res?.data ?? res;

export const applyCoupon = (code, subtotal) => client.post('/coupons/apply', { code, subtotal }).then(unwrap);
export const removeCoupon = () => client.post('/coupons/remove').then(unwrap);
