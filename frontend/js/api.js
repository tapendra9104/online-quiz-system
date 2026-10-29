// ============================================================
// API Service — HTTP client wrapper
// ============================================================

const API_BASE = '/api';

const api = {
  /** Get the stored JWT token */
  getToken() {
    return localStorage.getItem('quiz_token');
  },

  /** Build authorization headers */
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = this.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  /** Generic fetch wrapper */
  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.headers(),
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();

      if (!res.ok) {
        throw { status: res.status, message: data.error || 'Request failed', details: data.details };
      }
      return data;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('quiz_token');
        localStorage.removeItem('quiz_user');
        window.location.hash = '#/login';
      }
      throw err;
    }
  },

  get(endpoint)       { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body)  { return this.request('PUT', endpoint, body); },
  delete(endpoint)     { return this.request('DELETE', endpoint); },
};
