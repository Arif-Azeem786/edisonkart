import client from '../api/client';
const unwrap = (res) => res?.data ?? res;
export const submitContact = (data) => client.post('/contact', data).then(unwrap);
export const getContacts = (params) => client.get('/contact', { params }).then(unwrap);
export const updateContactStatus = (id, status) => client.put(`/contact/${id}/status`, { status }).then(unwrap);
export const deleteContact = (id) => client.delete(`/contact/${id}`).then(unwrap);
