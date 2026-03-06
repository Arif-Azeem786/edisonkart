import api from './axios';

/**
 * Send a message to the support chatbot.
 * @param {string} message - User message
 * @param {Array<{ role: 'user'|'assistant', content: string }>} history - Optional conversation history for context
 * @returns {Promise<{ reply: string, success: boolean }>}
 */
export const sendChatMessage = (message, history = []) =>
  api.post('/chat', { message, history }).then((res) => res?.data ?? res);
