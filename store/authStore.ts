import { create } from "zustand";

interface User {
  id: number;
  email: string;
  mobile: string;
  is_admin: boolean;
  avatar_id: number;
}

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
