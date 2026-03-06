import api from './axios';

export const getPublicSettings = async () => {
  const res = await api.get('/settings/public');
  return res.data?.data || res.data;
};

export const getAllSettings = async () => {
  const res = await api.get('/settings');
  return res.data?.data || res.data;
};

export const updateSetting = async (key, value) => {
  const res = await api.put('/settings', { key, value });
  return res.data?.data || res.data;
};

export const toggleCod = async () => {
  const res = await api.post('/settings/toggle-cod');
  return res.data?.data || res.data;
};
