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

// Attach tokens to requests
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminAccessToken');
  const userToken = localStorage.getItem('userAccessToken');
  
  if (adminToken && config.url.includes('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
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

    // Handle 401 Unauthorized for both ADMIN and USER
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const isAdmin = originalRequest.url.includes('/admin');
      const refreshToken = isAdmin 
        ? localStorage.getItem('adminRefreshToken') 
        : localStorage.getItem('userRefreshToken');

      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const refreshUrl = isAdmin ? '/admin/refresh' : '/user-auth/refresh';
        const { data } = await axios.post(`${API_BASE}${refreshUrl}`, { refreshToken }, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        const newToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        if (isAdmin) {
          localStorage.setItem('adminAccessToken', newToken);
          if (newRefreshToken) localStorage.setItem('adminRefreshToken', newRefreshToken);
        } else {
          localStorage.setItem('userAccessToken', newToken);
          if (newRefreshToken) localStorage.setItem('userRefreshToken', newRefreshToken);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (isAdmin) {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
        } else {
          localStorage.removeItem('userAccessToken');
          localStorage.removeItem('userRefreshToken');
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.error || '';
      if (errorMsg.includes('CSRF')) {
        console.error('🛡️ CSRF Blocked! This request is missing the required security header.');
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

// ====== USER AUTH (MODIFY ORDER) ======
export const requestUserOtp = (email, orderId) => api.post('/user-auth/request-otp', { email, orderId });
export const verifyUserOtp = (email, otp) => api.post('/user-auth/verify-otp', { email, otp });
export const refreshUserToken = (refreshToken) => api.post('/user-auth/refresh', { refreshToken });

export const getMyOrders = () => api.get('/orders/my-orders');
export const getMyOrderLogs = (orderId) => api.get(`/orders/${orderId}/logs`);
export const updateUserJersey = (orderId, itemId, data) => api.put(`/orders/${orderId}/items/${itemId}`, data);
export const deleteUserJersey = (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`);

// ====== ADMIN ORDERS LOGS ======
export const getOrderLogs = (orderId) => api.get(`/admin/orders/${orderId}/logs`);

export default api;
