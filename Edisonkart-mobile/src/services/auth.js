import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const register = (userData) => client.post('/auth/register', userData).then(unwrap);
export const verifyOTP = (email, otp) => client.post('/auth/verify-otp', { email, otp }).then(unwrap);
export const login = (email, password) => client.post('/auth/login', { email, password }).then(unwrap);
export const resendOTP = (email) => client.post('/auth/resend-otp', { email }).then(unwrap);
export const forgotPassword = (email) => client.post('/auth/forgot-password', { email }).then(unwrap);
export const resetPassword = (email, otp, newPassword) =>
  client.post('/auth/reset-password', { email, otp, newPassword }).then(unwrap);
export const googleLogin = (idToken) => client.post('/auth/google', { idToken }).then(unwrap);
