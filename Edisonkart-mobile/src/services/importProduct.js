import client from '../api/client';

const unwrap = (res) => res?.data ?? res;

export const importFromUrl = (url) => client.post('/products/import', { url }, { timeout: 180000 }).then(unwrap);
