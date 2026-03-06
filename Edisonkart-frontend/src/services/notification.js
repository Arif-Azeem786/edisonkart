import api from './axios';
export const getNotifications = (params) => api.get('/notifications', { params }).then(res => res.data);
export const getUnreadCount = () => api.get('/notifications/unread-count').then(res => res.data);
export const markAsRead = (id) => api.put(`/notifications/${id}/read`).then(res => res.data);
export const markAllAsRead = () => api.put('/notifications/mark-all-read').then(res => res.data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`).then(res => res.data);
