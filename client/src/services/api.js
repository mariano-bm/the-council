const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = `${API_URL}/api`;

function getToken() {
  return localStorage.getItem('council_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('council_token', token);
  else localStorage.removeItem('council_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
