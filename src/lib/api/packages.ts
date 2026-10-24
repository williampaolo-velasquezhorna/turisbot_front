import { apiFetch } from "./client";
import type {
  Package,
  PackageFilters,
  PackageFormData,
  Paginated,
} from "@/types";

export const packagesApi = {
  list: (filters: PackageFilters = {}) =>
    apiFetch<Paginated<Package>>("/packages", { query: filters }),

  find: (id: string) => apiFetch<Package>(`/packages/${id}`),

  create: (data: PackageFormData) =>
    apiFetch<Package>("/packages", { method: "POST", body: data, auth: true }),

  update: (id: string, data: PackageFormData) =>
    apiFetch<Package>(`/packages/${id}`, {
      method: "PUT",
      body: data,
      auth: true,
    }),

  remove: (id: string) =>
    apiFetch(`/packages/${id}`, { method: "DELETE", auth: true }),
};
