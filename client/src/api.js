const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'tarnished-ledger-token';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('tarnished-ledger-user', JSON.stringify(user));
}
export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('tarnished-ledger-user') || 'null'); } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('tarnished-ledger-user');
  window.dispatchEvent(new Event('ledger:signout'));
}
export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers }); }
  catch { throw new Error('Unable to reach the API. Check that the server is running on port 5000.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status === 401 && getToken()) { clearSession(); throw new Error('Your session expired. Sign in again.'); }
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status}).`);
  return data;
}
export const money = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(value) || 0);
export const dateTime = (value) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
