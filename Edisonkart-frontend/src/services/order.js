import api from './axios';

export const createOrder = (addressId) => api.post('/orders', { addressId }).then(res => res.data);
export const getOrder = (orderId) => api.get(`/orders/${orderId}`).then(res => res.data);
export const getUserOrders = (page = 1) => api.get('/orders/my-orders', { params: { page } }).then(res => res.data);

export const getOrders = (params) => api.get('/admin/orders', { params }).then(res => res.data);
export const updateOrderStatus = (orderId, data) => api.put(`/orders/${orderId}/status`, data).then(res => res.data);
export const placeOrder = (data, token) =>
  api.post('/orders', data, token ? { headers: { Authorization: `Bearer ${token}` } } : {}).then(res => res.data);

export const cancelOrder = (orderId, reason) => api.post(`/orders/${orderId}/cancel`, { reason }).then(res => res.data);
export const requestReturn = (orderId, type, reason) => api.post(`/orders/${orderId}/return`, { type, reason }).then(res => res.data);

export const getReturnRequests = () => api.get('/orders/admin/returns').then(res => res.data);
export const processReturn = (orderId, action, comment) => api.post(`/orders/${orderId}/return-action`, { action, comment }).then(res => res.data);
export const downloadInvoice = async (orderId) => {
    const blob = await api.get(`/orders/${orderId}/download-invoice`, {
        responseType: 'blob'
    });

    // The axios interceptor returns response.data, which is already the Blob
    // Avoid wrapping a Blob inside another Blob (that corrupts the PDF)
    const finalBlob = blob instanceof Blob
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

    const url = window.URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // clean up memory
};