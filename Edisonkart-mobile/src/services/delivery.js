import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const getAssignedOrders = (status) => {
  const params = status ? { status } : {};
  return client.get('/delivery/orders', { params }).then(unwrap);
};
export const getDeliveryStats = () => client.get('/delivery/stats').then(unwrap);
export const updateDeliveryStatus = (orderId, status) => client.put(`/delivery/orders/${orderId}/status`, { status }).then(unwrap);
export const checkPincodeServiceability = (pincode) => client.get(`/serviceability/check/${pincode}`).then(unwrap);
