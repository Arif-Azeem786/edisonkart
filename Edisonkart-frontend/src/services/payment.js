import api from './axios';

export const getPaymentStatus = (orderId) => api.get(`/payments/order/${orderId}`).then(res => res.data);
export const retryPayment = (orderId) => api.post(`/payments/order/${orderId}/retry`).then(res => res.data);
