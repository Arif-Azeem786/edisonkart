import api from './axios';

export const getProducts = (params) => api.get('/products', { params }).then(res => res.data);
export const getSearchSuggestions = (q) => api.get('/products/search/suggestions', { params: { q } }).then(res => res.data);
export const getAdminProducts = (params) => api.get('/products/admin', { params }).then(res => res.data);
export const getProductBySlug = (slug) => api.get(`/products/${slug}`).then(res => res.data);
export const getProductById = (id) => api.get(`/products/${id}`).then(res => res.data);
export const getCategories = () => api.get('/categories').then(res => res.data);
export const getProductImage = (imageId) => `${api.defaults.baseURL}/products/image/${imageId}`;

export const createProduct = (productData) => api.post('/products', productData);
export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/products/${id}`);