import api from './axios';

export const register = (userData) => api.post('/auth/register', userData).then(res => res.data);
export const verifyOTP = (email, otp) => api.post('/auth/verify-otp', { email, otp }).then(res => res.data);
export const login = (email, password) => api.post('/auth/login', { email, password }).then(res => res.data);
export const resendOTP = (email) => api.post('/auth/resend-otp', { email }).then(res => res.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then(res => res.data);
export const verifyResetOTP = (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }).then(res => res.data);
export const resetPassword = (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }).then(res => res.data);
export const googleLogin = (idToken, accessToken, userInfo) =>
  api.post('/auth/google', { idToken, accessToken, userInfo }).then(res => res.data);