import client from '../api/client';
const unwrap = (res) => res?.data ?? res;

export const getQuestions = (productId) => client.get(`/qa/product/${productId}`).then(unwrap);
export const askQuestion = (productId, text) => client.post('/qa', { productId, text }).then(unwrap);
export const answerQuestion = (questionId, text) => client.post(`/qa/${questionId}/answer`, { text }).then(unwrap);
export const markHelpful = (questionId, answerId) => client.post(`/qa/${questionId}/answer/${answerId}/helpful`).then(unwrap);
