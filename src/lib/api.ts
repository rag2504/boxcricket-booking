import axios from "axios";
import { isMongoObjectId } from "./utils";

// Use local development server in development, deployed in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? "http://localhost:3001/api" : "https://box-junu.onrender.com/api");

// Log API URL for debugging
console.log("🔗 API Base URL:", API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased from 10s to 30s
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("boxcric_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. Please try again.');
      return Promise.reject({ message: 'Request timed out. The server is taking too long to respond.' });
    }
    
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("boxcric_token");
      localStorage.removeItem("boxcric_user");
      window.location.href = "/login";
    }
    
    return Promise.reject(error.response?.data || error);
  },
);

// Auth API
export const authApi = {
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/auth/register", data),

  verifyRegistration: (data: {
    email: string;
    otp: string;
    tempToken: string;
  }) => api.post("/auth/verify-registration", data),

  login: (data: { emailOrPhone: string; password: string }) =>
    api.post("/auth/login", data),

  requestLoginOTP: (data: { email: string }) =>
    api.post("/auth/request-login-otp", data),

  verifyLoginOTP: (data: { email: string; otp: string }) =>
    api.post("/auth/verify-login-otp", data),

  getMe: () => api.get("/auth/me"),

  refreshToken: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),
};

// Grounds API
export const groundsApi = {
  getGrounds: (params?: {
    cityId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    pitchType?: string;
    lighting?: boolean;
    parking?: boolean;
    minRating?: number;
    lat?: number;
    lng?: number;
    maxDistance?: number;
    page?: number;
    limit?: number;
  }) => api.get("/grounds", { params }),

  getGround: (id: string) => api.get(`/grounds/${id}`),

  getAvailability: (id: string, date: string) =>
    api.get(`/grounds/${id}/availability/${date}`),

  addReview: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/grounds/${id}/reviews`, data),

  getReviews: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/grounds/${id}/reviews`, { params }),

  searchAutocomplete: (q: string) =>
    api.get("/grounds/search/autocomplete", { params: { q } }),
};

// Bookings API
export const bookingsApi = {
  createBooking: async (data: any) => {
    if (!isMongoObjectId(data.groundId)) {
      throw new Error("This ground cannot be booked online.");
    }
    
    // The frontend now sends timeSlot in the correct format, so we don't need to construct it
    return api.post("/bookings", data);
  },

  getMyBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get("/bookings/my-bookings", { params }),

  getBooking: (id: string) => api.get(`/bookings/${id}`),

  updateBookingStatus: (
    id: string,
    data: { status: string; reason?: string },
  ) => api.patch(`/bookings/${id}/status`, data),

  addFeedback: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/bookings/${id}/feedback`, data),

  getStats: () => api.get("/bookings/stats/summary"),

  // Temporary hold APIs
  createTemporaryHold: async (data: {
    groundId: string;
    bookingDate: string;
    timeSlot: string;
  }) => {
    if (!isMongoObjectId(data.groundId)) {
      throw new Error("This ground cannot be booked online.");
    }
    return api.post("/bookings/temp-hold", data);
  },

  releaseTemporaryHold: (holdId: string) => 
    api.delete(`/bookings/temp-hold/${holdId}`),

  getGroundAvailability: (groundId: string, date: string) =>
    api.get(`/bookings/ground/${groundId}/${date}`),
};

// Payments API
export const paymentsApi = {
  createOrder: (data: { bookingId: string }) =>
    api.post("/payments/create-order", data),

  verifyPayment: (data: {
    order_id: string;
    payment_session_id: string;
    bookingId: string;
  }) => api.post("/payments/verify-payment", data),

  paymentFailed: (data: {
    bookingId: string;
    order_id: string;
    error: any;
  }) => api.post("/payments/payment-failed", data),

  initiateRefund: (data: { bookingId: string; reason?: string }) =>
    api.post("/payments/refund", data),

  getPaymentHistory: (params?: { page?: number; limit?: number }) =>
    api.get("/payments/history", { params }),

  getPaymentDetails: (paymentId: string) => api.get(`/payments/${paymentId}`),
};

// Users API
export const usersApi = {
  updateProfile: (data: {
    name?: string;
    phone?: string;
    location?: any;
    preferences?: any;
  }) => api.put("/users/profile", data),

  addToFavorites: (groundId: string) =>
    api.post(`/users/favorites/${groundId}`),

  removeFromFavorites: (groundId: string) =>
    api.delete(`/users/favorites/${groundId}`),

  getFavorites: () => api.get("/users/favorites"),

  updateNotificationPreferences: (data: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    marketing?: boolean;
  }) => api.put("/users/preferences/notifications", data),

  getDashboard: () => api.get("/users/dashboard"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/users/change-password", data),

  deleteAccount: (data: { password: string }) =>
    api.delete("/users/account", { data }),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }) => api.get("/notifications", { params }),

  getUnreadCount: () => api.get("/notifications/count"),

  markAsRead: (notificationId: string) => 
    api.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () => api.patch("/notifications/read-all"),

  deleteNotification: (notificationId: string) => 
    api.delete(`/notifications/${notificationId}`),
};

// Admin Notifications API
export const adminNotificationsApi = {
  sendBroadcast: (data: {
    title: string;
    message: string;
    priority?: string;
    actionUrl?: string;
  }) => api.post("/admin/notifications/broadcast", data),

  getStats: () => api.get("/admin/notifications/stats"),
};

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem("boxcric_token", token);
};

export const removeAuthToken = () => {
  localStorage.removeItem("boxcric_token");
  localStorage.removeItem("boxcric_user");
};

export const getAuthToken = () => {
  return localStorage.getItem("boxcric_token");
};

export const setUser = (user: any) => {
  localStorage.setItem("boxcric_user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("boxcric_user");
  return user ? JSON.parse(user) : null;
};

export default api;