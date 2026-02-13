import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://jersee-ice-backend.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
});

// Attach JWT token to admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 globally with refresh logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔒 401 Unauthorized detected. Attempting token refresh...');
      if (isRefreshing) {
        console.log('⏳ Refresh already in progress, queuing request.');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (!refreshToken) {
        console.error('❌ No refresh token found in localStorage. Forcing logout.');
        isRefreshing = false;
        localStorage.removeItem('adminAccessToken');
        return Promise.reject(error);
      }

      console.log('🔄 Calling refresh endpoint...');
      try {
        const { data } = await axios.post(`${API_BASE}/admin/refresh`, { refreshToken }, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const newToken = data.accessToken;
        console.log('✅ Token refreshed successfully!');
        localStorage.setItem('adminAccessToken', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
          console.warn('🔄 Redirecting to login page due to failed refresh.');
          window.location.href = '/admin';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 — only logout on auth-related 403, not CSRF failures
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.error || '';
      const isCsrf = errorMsg.includes('CSRF');
      if (!isCsrf) {
        console.error('🚫 403 Forbidden. Invalid token or session expired. Logging out.');
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
          window.location.href = '/admin';
        }
      } else {
        console.warn('🛡️ CSRF protection triggered — not logging out.');
      }
    }
    return Promise.reject(error);
  }
);

// ====== PUBLIC ======
export const healthCheck = () => api.get('/health');

// Check contact existence
export const checkDuplicateContact = (params) => api.get('/orders/check-contact', { params });

export const submitOrder = (data) => api.post('/orders', data);

export const checkJerseyNumber = (number, batch) => {
  const batchParam = batch ? `&batch=${encodeURIComponent(batch)}` : '';
  return api.get(`/orders/check-jersey?number=${number}${batchParam}`);
};

export const checkNameExists = (name) =>
  api.get(`/orders/check-name?name=${encodeURIComponent(name)}`);

// ====== ADMIN AUTH ======
export const adminLogin = (username, password) =>
  api.post('/admin/login', { username, password });

export const adminRegister = (data) =>
  api.post('/admin/register', data);

export const resendAdminVerification = (email) =>
  api.post('/admin/resend-verification', { email });

export const verifyAdminEmail = (token) =>
  api.get(`/admin/verify-email/${token}`);

export const verifyToken = () => api.get('/admin/verify');
export const adminLogout = (refreshToken) => api.post('/admin/logout', { refreshToken });
export const refreshAdminToken = (refreshToken) => api.post('/admin/refresh', { refreshToken });

// --- PASSKEY AUTH ---
export const getPasskeyRegisterOptions = () => api.post('/auth/register-passkey/options');
export const verifyPasskeyRegister = (body, name) => api.post('/auth/register-passkey/verify', { ...body, name });
export const getPasskeyLoginOptions = (username) => api.post('/auth/login-passkey/options', { username });
export const verifyPasskeyLogin = (username, body) => api.post('/auth/login-passkey/verify', { username, body });

export const listPasskeys = () => api.get('/auth/passkeys');
export const renamePasskey = (id, name) => api.patch(`/auth/passkeys/${id}`, { name });
export const deletePasskey = (id) => api.delete(`/auth/passkeys/${id}`);

// ====== ADMIN ORDERS ======
export const getOrders = (params = {}) =>
  api.get('/admin/orders', { params: { limit: 1000, ...params } });

export const getStats = () => api.get('/admin/stats');

export const updateOrderStatus = (id, status) =>
  api.patch(`/admin/orders/${id}/status`, { status });

export const updateOrder = (id, data) =>
  api.patch(`/admin/orders/${id}`, data);

export const bulkUpdateOrders = (ids, status) =>
  api.post('/admin/orders/bulk-status', { ids, status });

export const deleteOrder = (id) => api.delete(`/admin/orders/${id}`);

export const notifyCollection = () => api.post('/admin/notify-collection');

// ====== ADMIN EXPENSES ======
export const getExpenses = () => api.get('/admin/expenses');

export const addExpense = (data) => api.post('/admin/expenses', data);

export const updateExpense = (id, data) => api.patch(`/admin/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/admin/expenses/${id}`);

// ====== REPORTS ======
export const downloadReport = (type) =>
  api.get(`/admin/reports/${type}`, { responseType: 'blob' });

export default api;
