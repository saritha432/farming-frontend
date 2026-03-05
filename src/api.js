/**
 * AgroVibes API client.
 * Base URL: set REACT_APP_API_URL or defaults to http://localhost:5000
 */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'API error');
    err.status = res.status;
    try {
      err.body = await res.json();
    } catch {
      err.body = await res.text();
    }
    throw err;
  }
  return res.json();
}

function getClientId() {
  let id = localStorage.getItem('agrovibes_client_id');
  if (!id) {
    id = 'cid_' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('agrovibes_client_id', id);
  }
  return id;
}

export const api = {
  getClientId,

  getHealth: () => request('/api/health').catch(() => null),

  getPosts: (clientId) => {
    const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    return request(`/api/posts${q}`);
  },
  createPost: (formData) => {
    return fetch(`${BASE}/api/posts`, {
      method: 'POST',
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(res.statusText || 'Upload failed');
      return res.json();
    });
  },
  likePost: (postId) =>
    request(`/api/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ clientId: getClientId() }),
    }),
  getComments: (postId) => request(`/api/posts/${postId}/comments`),
  addComment: (postId, author, text) =>
    request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author, text }),
    }),
  followPost: (postId) =>
    request(`/api/posts/${postId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ clientId: getClientId() }),
    }),
  deletePost: (postId) =>
    request(`/api/posts/${postId}`, {
      method: 'DELETE',
    }),

  getGuides: () => request('/api/guides'),
  getEquipment: () => request('/api/equipment'),
  getWorkers: () => request('/api/workers'),
  getJobs: () => request('/api/jobs'),
  getProducts: () => request('/api/products'),
  getSales: () => request('/api/sales'),
  getCourses: () => request('/api/courses'),

  postJob: (body) => request('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
  postEquipment: (body) => request('/api/equipment', { method: 'POST', body: JSON.stringify(body) }),
  postSalesItem: (body) => request('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
  postGuide: (body) => {
    // Support both JSON body and FormData (for file uploads)
    if (body instanceof FormData) {
      return fetch(`${BASE}/api/guides`, {
        method: 'POST',
        body,
      }).then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Upload failed');
        return res.json();
      });
    }
    return request('/api/guides', { method: 'POST', body: JSON.stringify(body) });
  },
  postProduct: (body) => request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
};

export default api;
