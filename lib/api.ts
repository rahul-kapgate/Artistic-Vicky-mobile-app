import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshTokenResponse = {
  accessToken?: string;
  refreshToken?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}

/**
 * Main API client.
 *
 * EXPO_PUBLIC_API_URL should include /api:
 * https://your-backend.com/api
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Separate client for refreshing tokens.
 *
 * Do not use the main `api` client here because it contains
 * the 401 interceptor and could cause a refresh loop.
 */
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Prevent multiple simultaneous API failures from making
 * multiple refresh-token requests.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Prevent repeated logout and navigation operations.
 */
let logoutPromise: Promise<void> | null = null;

/**
 * Attach the access token to every request.
 */
api.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const accessToken = await SecureStore.getItemAsync("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Call the refresh-token API.
 */
async function performTokenRefresh(): Promise<string | null> {
  const currentRefreshToken = await SecureStore.getItemAsync("refreshToken");

  if (!currentRefreshToken) {
    console.log("Refresh skipped: refresh token not found");
    return null;
  }

  try {
    /*
     * API_BASE_URL already includes /api.
     *
     * Final URL:
     * https://your-backend.com/api/auth/refresh-token
     */
    const response = await refreshApi.post<RefreshTokenResponse>(
      "/auth/refresh-token",
      {
        token: currentRefreshToken,
      },
    );

    const { accessToken, refreshToken: nextRefreshToken } = response.data;

    if (!accessToken) {
      console.log("Refresh failed: access token missing in response");
      return null;
    }

    await SecureStore.setItemAsync("accessToken", accessToken);

    /**
     * Save a rotated refresh token when the backend
     * returns a new one.
     */
    if (nextRefreshToken) {
      await SecureStore.setItemAsync("refreshToken", nextRefreshToken);
    }

    console.log("Access token refreshed successfully");

    return accessToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("Refresh-token request failed", {
        url: `${API_BASE_URL}/auth/refresh-token`,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    } else {
      console.log("Refresh-token request failed", error);
    }

    return null;
  }
}

/**
 * Reuse the same refresh operation when multiple requests
 * return 401 at the same time.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/**
 * Clear the local session and navigate to login.
 */
async function clearSessionAndRedirect(): Promise<void> {
  if (!logoutPromise) {
    logoutPromise = (async () => {
      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("user"),
      ]);

      router.replace("/login");
    })().finally(() => {
      logoutPromise = null;
    });
  }

  await logoutPromise;
}

/**
 * Handle expired access tokens.
 */
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<any>) => {
    const originalRequest = error.config as RetryConfig | undefined;

    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    /**
     * Do not try refreshing when login/signup itself
     * returns 401.
     */
    const isPublicAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/google") ||
      requestUrl.includes("/auth/signup/") ||
      requestUrl.includes("/auth/refresh-token");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      }

      await clearSessionAndRedirect();
    }

    if (status === 403) {
      console.warn("Access forbidden:", error.response?.data?.message);
    }

    console.log("API request failed", {
      url: requestUrl,
      status,
      message: error.response?.data?.message || error.message,
    });

    return Promise.reject(error);
  },
);
