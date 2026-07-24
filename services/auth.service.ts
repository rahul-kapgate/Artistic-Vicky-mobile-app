import { api } from "../lib/api";

export const loginUser = async (identifier: string, password: string) => {
  const response = await api.post("/auth/login", {
    identifier,
    password,
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

export const initiateForgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password/initiate", {
    email,
  });

  return response.data;
};

export const verifyForgotPassword = async (payload: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  const response = await api.post("/auth/forgot-password/verify", payload);
  return response.data;
};
