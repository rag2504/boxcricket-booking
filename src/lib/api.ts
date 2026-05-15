import axios, { type AxiosError } from "axios";
import { isMongoObjectId } from "./utils";
import { API_BASE_URL, getApiBaseUrl } from "./config";

export { API_BASE_URL, getApiBaseUrl };

console.log("🔗 API Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("boxcric_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export type ApiErrorBody = {
  success?: boolean;
  message?: string;
  code?: string;
  environment?: string;
};

api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject({
        message: "Request timed out. The server is taking too long to respond.",
        code: "TIMEOUT",
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("boxcric_token");
      localStorage.removeItem("boxcric_user");
      window.location.href = "/login";
    }

    const body = error.response?.data;
    return Promise.reject(
      body && typeof body === "object"
        ? body
        : { message: error.message || "Network error", code: "NETWORK_ERROR" }
    );
  }
);

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/auth/register", data),

  login: (data: { emailOrPhone: string; password: string }) =>
    api.post("/auth/login", data),

  getMe: () => api.get("/auth/me"),

  refreshToken: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),
};

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

export const bookingsApi = {
  createBooking: async (data: Record<string, unknown>) => {
    if (!isMongoObjectId(data.groundId as string)) {
      throw new Error("This ground cannot be booked online.");
    }
    return api.post("/bookings", data);
  },

  getMyBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get("/bookings/my-bookings", { params }),

  getBooking: (id: string) => api.get(`/bookings/${id}`),

  sendReceipt: (id: string) => api.post(`/bookings/${id}/send-receipt`),

  updateBookingStatus: (
    id: string,
    data: { status: string; reason?: string }
  ) => api.patch(`/bookings/${id}/status`, data),

  addFeedback: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/bookings/${id}/feedback`, data),

  getStats: () => api.get("/bookings/stats/summary"),

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

export const paymentsApi = {
  createOrder: (data: { bookingId: string }) =>
    api.post("/payments/create-order", data),

  verifyPayment: (data: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post("/payments/verify-payment", data),

  paymentFailed: (data: {
    bookingId: string;
    order_id: string;
    error: unknown;
  }) => api.post("/payments/payment-failed", data),

  getPaymentStatus: (bookingId: string, orderId?: string) =>
    api.get(`/payments/status/${bookingId}`, {
      params: orderId ? { order_id: orderId } : undefined,
    }),

  initiateRefund: (data: { bookingId: string; reason?: string }) =>
    api.post("/payments/refund", data),

  getPaymentHistory: (params?: { page?: number; limit?: number }) =>
    api.get("/payments/history", { params }),

  getPaymentDetails: (paymentId: string) => api.get(`/payments/${paymentId}`),
};

export const usersApi = {
  updateProfile: (data: {
    name?: string;
    phone?: string;
    location?: Record<string, unknown>;
    preferences?: Record<string, unknown>;
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

export const adminNotificationsApi = {
  sendBroadcast: (data: {
    title: string;
    message: string;
    priority?: string;
    actionUrl?: string;
  }) => api.post("/admin/notifications/broadcast", data),

  getStats: () => api.get("/admin/notifications/stats"),
};

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

export const setUser = (user: Record<string, unknown>) => {
  localStorage.setItem("boxcric_user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("boxcric_user");
  return user ? JSON.parse(user) : null;
};

export default api;
