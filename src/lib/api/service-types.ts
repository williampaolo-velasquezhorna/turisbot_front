import { apiFetch } from "./client";
import type { ServiceType } from "@/types";

export const serviceTypesApi = {
  list: () => apiFetch<ServiceType[]>("/service-types"),

  create: (data: { name: string; description?: string }) =>
    apiFetch<{
      name: string;
      description?: string;
    }>("/service-types", { method: "POST", body: data, auth: true }),

  update: (id: string, data: { name: string; description?: string }) =>
    apiFetch(`/service-types/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  remove: (id: string) =>
    apiFetch(`/service-types/${id}`, { method: "DELETE", auth: true }),
};
