import axios from 'axios'
import { toast } from '../components/ui/use-toast'

const api = axios.create({
  baseURL: '/api',     // ✅ RELATIVE PATH (CRITICAL)
  withCredentials: true,
})

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const { method, url, params, data } = config;
    // console.log('[API Request] ' + (method?.toUpperCase() || '') + ' ' + (url || ''), params || '', data || '');

    config.headers = config.headers || {}

    if (data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      config.headers['Content-Type'] ??= 'application/json'
    }
    // Don't overwrite Authorization if already set (e.g. placeOrder passes token from store)
    if (!config.headers.Authorization) {
      let token = null;
      try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.state?.token ?? parsed?.token ?? null;
        }
      } catch (e) {
        token = null;
      }
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
    }
    return config;
  },
  (error) => {
    toast({
      variant: 'destructive',
      title: 'Request Error',
      description: 'Failed to send request. Please check your connection.',
    })
    return Promise.reject(error)
  }
)

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAuthRequest = requestUrl.includes('/auth/')
      const isOrderRequest = requestUrl.includes('/orders')
      const isOnLoginPage = window.location.pathname === '/login'

      // Don't redirect for order requests — let checkout show "sign in again" and keep user on page
      if (!isAuthRequest && !isOnLoginPage && !isOrderRequest) {
        window.location.href = '/login'
      }
      // Reject with a consistent shape so callers can show a friendly message instead of "status code 401"
      return Promise.reject(
        error.response?.data && typeof error.response.data === 'object'
          ? error.response.data
          : { success: false, message: 'Please log in to continue.' }
      )
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    }

    return Promise.reject(error.response?.data || error.message)
  }
)

export default api