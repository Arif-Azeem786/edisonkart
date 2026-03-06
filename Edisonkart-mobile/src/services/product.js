import client from '../api/client';
import { API_BASE_URL } from '../config';

const unwrap = (res) => res?.data ?? res;

export const getProducts = (params) => client.get('/products', { params }).then(unwrap);
export const getProductBySlug = (slug) => client.get(`/products/${slug}`).then(unwrap);
export const getProductById = (id) => client.get(`/products/${id}`).then(unwrap);
export const getCategories = () => client.get('/categories').then(unwrap);
export const getSearchSuggestions = (q) => client.get('/products/search/suggestions', { params: { q } }).then(unwrap);

export const getProductImageUrl = (imageId) => `${API_BASE_URL}/products/image/${imageId}`;
export const getProductVideoUrl = (videoId) => `${API_BASE_URL}/products/video/${videoId}`;
export const getAdminProducts = (params) => client.get('/products/admin', { params }).then(unwrap);
export const createProduct = (formData) => client.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
export const updateProduct = (id, formData) => client.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
export const deleteProduct = (id) => client.delete(`/products/${id}`).then(unwrap);
