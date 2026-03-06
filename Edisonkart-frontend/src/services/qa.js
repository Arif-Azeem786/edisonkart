import api from './axios';
export const getQuestions = (productId) => api.get(`/qa/product/${productId}`).then(res => res.data);
export const askQuestion = (productId, text) => api.post('/qa', { productId, text }).then(res => res.data);
export const answerQuestion = (questionId, text) => api.post(`/qa/${questionId}/answer`, { text }).then(res => res.data);
export const markHelpful = (questionId, answerId) => api.post(`/qa/${questionId}/answer/${answerId}/helpful`).then(res => res.data);
