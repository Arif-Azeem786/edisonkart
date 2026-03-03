import api from './axios';

export const getCategories = () => api.get('/categories').then(res => res.data);
export const getAdminCategories = () => api.get('/categories', { params: { includeInactive: 'true' } }).then(res => res.data);
export const createCategory = (categoryData) => api.post('/categories', categoryData);
export const updateCategory = (id, categoryData) => api.put(`/categories/${id}`, categoryData);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
