import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const getCategories = () => client.get('/categories').then(unwrap);
export const getAdminCategories = () => client.get('/categories', { params: { includeInactive: 'true' } }).then(unwrap);
export const createCategory = (data) => client.post('/categories', data).then(unwrap);
export const updateCategory = (id, data) => client.put(`/categories/${id}`, data).then(unwrap);
export const deleteCategory = (id) => client.delete(`/categories/${id}`).then(unwrap);
