import { api } from './client.js';

export async function getDashboard() {
  const { data } = await api.get('/stats/dashboard');
  return data;
}
