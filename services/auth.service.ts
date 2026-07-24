import { api } from "../lib/api";

export type AuthUser = {
  id: number;
  user_name: string;
  email: string;
  mobile: string | null;
  is_admin: boolean;
  avatar_id: number;
  auth_provider: "local" | "google" | "local_google";
  profile_picture?: string | null;
};

export type AuthResponse = {
  message: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
};

export const loginUser = async (
  identifier: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", {
    identifier,
    password,
  });

  return response.data;
};

export const loginWithGoogle = async (
  credential: string,
): Promise<AuthResponse> => {
  if (!credential) {
    throw new Error("Google ID token is required");
  }

  const response = await api.post("/auth/google", {
    credential,
  });

  return response.data;
};

export const initiateSignup = async (payload: {
  user_name: string;
  email: string;
  mobile: string;
  password: string;
}) => {
  const response = await api.post("/auth/signup/initiate", payload);

  return response.data;
};

export const verifySignupOtp = async (email: string, otp: string) => {
  const response = await api.post("/auth/signup/verify", {
    email,
    otp,
  });

  return response.data;
};
