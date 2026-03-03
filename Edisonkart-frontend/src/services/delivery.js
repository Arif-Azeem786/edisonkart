import api from './axios';

export const getAssignedOrders = (status) => {
  const params = status ? { status } : {};
  return api.get('/delivery/orders', { params }).then(res => res.data);
};

export const getDeliveryStats = () =>
  api.get('/delivery/stats').then(res => res.data);

export const updateDeliveryStatus = (orderId, status) =>
  api.put(`/delivery/orders/${orderId}/status`, { status }).then(res => res.data);

export const checkPincodeServiceability = (pincode) =>
  api.get(`/serviceability/check/${pincode}`).then(res => res.data);
