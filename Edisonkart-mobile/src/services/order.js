import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const createOrder = (addressId) => client.post('/orders', { addressId }).then(unwrap);
export const getOrder = (orderId) => client.get(`/orders/${orderId}`).then(unwrap);
export const getUserOrders = (page = 1) => client.get('/orders/my-orders', { params: { page } }).then(unwrap);
export const placeOrder = (data, token) =>
  client.post('/orders', data, token ? { headers: { Authorization: `Bearer ${token}` } } : {}).then(unwrap);
export const cancelOrder = (orderId, reason) =>
  client.post(`/orders/${orderId}/cancel`, { reason }).then(unwrap);
export const getAdminOrders = (params) => client.get('/admin/orders', { params }).then(unwrap);
export const updateOrderStatus = (orderId, data) => client.put(`/orders/${orderId}/status`, data).then(unwrap);
export const requestReturn = (orderId, type, reason) => client.post(`/orders/${orderId}/return`, { type, reason }).then(unwrap);
