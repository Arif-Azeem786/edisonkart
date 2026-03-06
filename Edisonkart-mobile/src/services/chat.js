import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const sendChatMessage = (message, history = []) =>
  client.post('/chat', { message, history }).then(unwrap).then((body) => body?.data ?? body);
