import client from '../api/client';
const unwrap = (res) => res?.data ?? res;

export const getNotifications = (params) => client.get('/notifications', { params }).then(unwrap);
export const getUnreadCount = () => client.get('/notifications/unread-count').then(unwrap);
export const markAsRead = (id) => client.put(`/notifications/${id}/read`).then(unwrap);
export const markAllAsRead = () => client.put('/notifications/mark-all-read').then(unwrap);
export const deleteNotification = (id) => client.delete(`/notifications/${id}`).then(unwrap);
