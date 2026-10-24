import { apiFetch } from "./client";
import type { DestinationCountry, DestinationRegion } from "@/types";

export const destinationsApi = {
  findEnabledCountries: () =>
    apiFetch<DestinationCountry[]>("/destinations/countries"),

  findAllCountries: () =>
    apiFetch<DestinationCountry[]>("/destinations/countries/all", {
      auth: true,
    }),

  updateCountry: (id: string, enabled: boolean) =>
    apiFetch<DestinationCountry>(`/destinations/countries/${id}`, {
      method: "PUT",
      body: { enabled },
      auth: true,
    }),

  findRegions: () => apiFetch<DestinationRegion[]>("/destinations/regions"),

  createRegion: (data: {
    name: string;
    provinces: string[];
    country?: string;
  }) =>
    apiFetch<DestinationRegion>("/destinations/regions", {
      method: "POST",
      body: data,
      auth: true,
    }),

  updateRegion: (id: string, provinces: string[]) =>
    apiFetch<DestinationRegion>(`/destinations/regions/${id}`, {
      method: "PUT",
      body: { provinces },
      auth: true,
    }),

  removeRegion: (id: string) =>
    apiFetch(`/destinations/regions/${id}`, { method: "DELETE", auth: true }),
};
