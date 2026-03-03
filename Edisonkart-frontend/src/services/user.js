
import api from './axios';

// Get user profile
export const getProfile = () => api.get('/users/profile').then(res => res.data);

// Update user profile
export const updateProfile = (data) => api.put('/users/profile', data).then(res => res.data);

// Upload avatar
export const uploadAvatar = (formData) => api.put('/users/avatar', formData).then(res => res.data);

// Add new address
export const addAddress = (data) => api.post('/users/addresses', data).then(res => res.data);

// Update address
export const updateAddress = (id, data) => api.put(`/users/addresses/${id}`, data).then(res => res.data);

// Delete address
export const deleteAddress = (id) => api.delete(`/users/addresses/${id}`).then(res => res.data);
