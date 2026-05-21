import { api } from './client.js';

export async function fetchBackup() {
  const { data } = await api.get('/backup/json');
  return data;
}

export async function importBackup(backup, { replace = false } = {}) {
  const { data } = await api.post('/backup/import', { backup, replace });
  return data;
}

export function downloadBackupFile(backup) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sangkap-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
