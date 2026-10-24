import { apiFetch } from "./client";
import type { User } from "@/types";

export const usersApi = {
  updateProfile: (data: {
    nombres?: string;
    apellidos?: string;
    email?: string;
    username?: string;
  }) =>
    apiFetch<{ message: string; user: User }>("/users/profile", {
      method: "PATCH",
      body: data,
      auth: true,
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>("/users/change-password", {
      method: "POST",
      body: data,
      auth: true,
    }),
};
