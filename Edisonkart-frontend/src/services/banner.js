import api from './axios';

export const getBanners = () => api.get('/banners').then(res => res.data);
export const getAllBanners = () => api.get('/banners/admin').then(res => res.data);
export const createBanner = (formData) => api.post('/banners', formData);
export const updateBanner = (id, formData) => api.put(`/banners/${id}`, formData);
export const deleteBanner = (id) => api.delete(`/banners/${id}`);
