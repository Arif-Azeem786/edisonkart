import api from './axios';
export const applyCoupon = (code, subtotal) => api.post('/coupons/apply', { code, subtotal }).then(res => res.data);
export const removeCoupon = () => api.post('/coupons/remove').then(res => res.data);
export const getCoupons = () => api.get('/coupons').then(res => res.data);
export const createCoupon = (data) => api.post('/coupons', data).then(res => res.data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data).then(res => res.data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`).then(res => res.data);
