import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_STORAGE_KEY = 'auth-storage';

client.interceptors.request.use(async (config) => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token ?? parsed?.token ?? null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

client.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const status = err.response?.status;
    if (status === 401) {
      try {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (_) {}
    }
    let message = err.response?.data?.message || err.message || 'Something went wrong';
    if (err.code === 'ECONNABORTED') {
      message = 'Request timed out. The server is taking too long to respond.';
    } else if (!err.response && err.message?.includes?.('Network Error')) {
      message = 'Network error. Please check your connection and make sure the server is running.';
    }
    return Promise.reject({ message, status: status || 0, code: err.code });
  }
);

export default client;
