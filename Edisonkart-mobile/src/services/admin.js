import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const getUsers = (params) => client.get('/admin/users', { params }).then(unwrap);
export const createDeliveryBoy = (userData) => client.post('/admin/delivery-boy', userData).then(unwrap);
export const createEmployee = (userData) => client.post('/admin/employee', userData).then(unwrap);
export const createVendor = (userData) => client.post('/admin/vendor', userData).then(unwrap);
export const getDashboardStats = () => client.get('/admin/dashboard').then(unwrap);
