import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor to attach access token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Helper function to refresh token
async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");

  if (!refreshToken) return null;

  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh-token`,
      { token: refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const { accessToken } = response.data;

    if (accessToken) {
      await SecureStore.setItemAsync("accessToken", accessToken);
      return accessToken;
    }

    return null;
  } catch (error) {
    console.log("Failed to refresh token:", error);
    return null;
  }
}

// ✅ Response interceptor to handle expired token
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const originalRequest = error.config as RetryConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // retry original request
        return api(originalRequest);
      }

      // refresh failed, logout user
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      await SecureStore.deleteItemAsync("user");

      router.replace("/login");
    }

    if (error.response?.status === 403) {
      console.warn("Access forbidden:", error.response.data?.message);
    }

    console.log("API Error:", error.response?.data || error.message);

    return Promise.reject(error);
  },
);
