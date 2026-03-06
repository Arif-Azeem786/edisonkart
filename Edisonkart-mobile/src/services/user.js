import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const getProfile = () => client.get('/users/profile').then(unwrap);
export const updateProfile = (data) => client.put('/users/profile', data).then(unwrap);
export const addAddress = (data) => client.post('/users/addresses', data).then(unwrap);
export const updateAddress = (id, data) => client.put(`/users/addresses/${id}`, data).then(unwrap);
export const deleteAddress = (id) => client.delete(`/users/addresses/${id}`).then(unwrap);
