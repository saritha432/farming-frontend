/**
 * AgroVibes API client.
 * Base URL: set REACT_APP_API_URL or defaults to http://localhost:5000
 */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AUTH_TOKEN_KEY = 'agrovibes_token';

function getToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getAuthHeaders() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) setToken(null);
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
  getToken,
  setToken,

  getHealth: () => request('/api/health').catch(() => null),

  // Auth (Instagram-style user management)
  authLogin: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }).then((data) => {
      if (data.token) setToken(data.token);
      return data;
    }),
  authSignup: (body) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }).then((data) => {
      if (data.token) setToken(data.token);
      return data;
    }),
  authLogout: () => {
    setToken(null);
    return Promise.resolve();
  },
  getMe: () => request('/api/auth/me'),
  // Profile helpers currently use only client-side filtering of posts.
  // These endpoints are defined for future API use but not required now.
  getUserProfile: (userId) => request(`/api/users/${userId}`),
  updateProfile: (body) =>
    request('/api/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  getMyPosts: () => Promise.resolve([]),

  getPosts: (clientId) => {
    const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    return request(`/api/posts${q}`);
  },
  createPost: (formData) => {
    return fetch(`${BASE}/api/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
  deleteComment: (postId, commentId) =>
    request(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
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
  getKnowledgeSessions: (clientId) => {
    const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
    return request(`/api/knowledge/sessions${q}`);
  },
  getEquipment: () => request('/api/equipment'),
  getWorkers: () => request('/api/workers'),
  getJobs: () => request('/api/jobs'),
  getProducts: () => request('/api/products'),
  getSales: () => request('/api/sales'),
  getCourses: () => request('/api/courses'),

  postJob: (body) => request('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
  postEquipment: (body) => request('/api/equipment', { method: 'POST', body: JSON.stringify(body) }),
  postEquipmentRequest: (equipmentId, body) =>
    request(`/api/equipment/${equipmentId}/requests`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  postSalesItem: (body) => request('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
  postGuide: (body) => {
    // Support both JSON body and FormData (for file uploads)
    if (body instanceof FormData) {
      return fetch(`${BASE}/api/guides`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body,
      }).then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Upload failed');
        return res.json();
      });
    }
    return request('/api/guides', { method: 'POST', body: JSON.stringify(body) });
  },
  updateGuide: (id, body) =>
    request(`/api/guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteGuide: (id) =>
    request(`/api/guides/${id}`, {
      method: 'DELETE',
    }),
  postProduct: (body) => request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  createKnowledgeSession: (body) =>
    request('/api/knowledge/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateKnowledgeSession: (sessionId, body) =>
    request(`/api/knowledge/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteKnowledgeSession: (sessionId) =>
    request(`/api/knowledge/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  getKnowledgeSessionQuestions: (sessionId) =>
    request(`/api/knowledge/sessions/${sessionId}/questions`),
  subscribeKnowledgeSession: (sessionId, clientId) =>
    request(`/api/knowledge/sessions/${sessionId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    }),
  postKnowledgeQuestion: (sessionId, body) =>
    request(`/api/knowledge/sessions/${sessionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  // Users search & follow – always query the users API.
  // This ensures users without posts can still be found.
  searchUsers: async (q, clientId) => {
    const params = [];
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (clientId) params.push(`clientId=${encodeURIComponent(clientId)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return request(`/api/users${qs}`);
  },
  followUser: (userId) =>
    request(`/api/users/${userId}/follow`, {
      method: 'POST',
      body: JSON.stringify({ clientId: getClientId() }),
    }),
  // Follow requests across devices (user-to-user)
  createFollowRequest: (toUserId, fromUserId, fromName) =>
    request(`/api/users/${toUserId}/follow-request`, {
      method: 'POST',
      body: JSON.stringify({ fromUserId, fromName }),
    }),
  getMyFollowRequests: (toUserId, status = 'pending') => {
    const params = new URLSearchParams();
    if (toUserId != null) params.set('toUserId', String(toUserId));
    if (status) params.set('status', status);
    return request(`/api/users/follow-requests?${params.toString()}`);
  },
  respondFollowRequest: (id, action) =>
    request(`/api/users/follow-requests/${id}/${action}`, {
      method: 'POST',
    }),
  getFollowers: (userId) =>
    request(`/api/users/${userId}/followers`),
  getFollowing: (userId) =>
    request(`/api/users/${userId}/following`),
};

export default api;
