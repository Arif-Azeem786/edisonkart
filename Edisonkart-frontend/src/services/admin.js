import api from './axios';

export const getUsers = (params) => api.get('/admin/users', { params }).then(res => res.data);
export const createDeliveryBoy = (userData) => api.post('/admin/delivery-boy', userData).then(res => res.data);
export const createEmployee = (userData) => api.post('/admin/employee', userData).then(res => res.data);
export const createVendor = (userData) => api.post('/admin/vendor', userData).then(res => res.data);
export const getDashboardStats = () => api.get('/admin/dashboard').then(res => res.data);
