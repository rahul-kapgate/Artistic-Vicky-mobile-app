import { create } from "zustand";

export type User = {
  id: number;
  user_name: string;
  email: string;
  mobile: string | null;
  is_admin: boolean;
  avatar_id: number;
  auth_provider: "local" | "google" | "local_google";
  profile_picture?: string | null;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));
