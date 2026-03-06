import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const getBanners = () => client.get('/banners').then(unwrap);
export const getAllBanners = () => client.get('/banners/admin').then(unwrap);
export const createBanner = (formData) => client.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
export const updateBanner = (id, formData) => client.put(`/banners/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
export const deleteBanner = (id) => client.delete(`/banners/${id}`).then(unwrap);
