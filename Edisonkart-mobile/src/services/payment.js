import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const getPaymentStatus = (orderId) => client.get(`/payments/order/${orderId}`).then(unwrap);
export const retryPayment = (orderId) => client.post(`/payments/order/${orderId}/retry`).then(unwrap);
