import api from './axios';

export const submitContact = (data) => api.post('/contact', data).then(res => res.data);
export const getContacts = (params) => api.get('/contact', { params }).then(res => res.data);
export const updateContactStatus = (id, status) => api.put(`/contact/${id}/status`, { status }).then(res => res.data);
export const deleteContact = (id) => api.delete(`/contact/${id}`).then(res => res.data);
