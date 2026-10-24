import { apiFetch } from "./client";
import type { LoginResponse } from "@/types";

export const authApi = {
  login: (data: { usernameOrEmail: string; password: string }) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: data }),

  register: (data: {
    nombres: string;
    apellidos: string;
    email: string;
    username: string;
    password: string;
  }) => apiFetch("/auth/register", { method: "POST", body: data }),

  forgotPassword: (data: { email: string }) =>
    apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: data,
    }),

  resetPassword: (data: { token: string; password: string }) =>
    apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: data,
    }),

  confirmEmail: (token: string) =>
    apiFetch(`/auth/confirm-email?token=${encodeURIComponent(token)}`),
};
