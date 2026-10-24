"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { InlineSpinner } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ChevronDownIcon } from "@/components/ui/icons";
import { destinationsApi } from "@/lib/api/destinations";
import type { DestinationRegion } from "@/types";

/** Tarjeta de región: el catálogo de provincias es fijo;
 *  desmarcar solo deshabilita (nunca elimina). */
function RegionCard({
  region,
  onChange,
}: {
  region: DestinationRegion;
  onChange: (disabledProvinces: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allProvinces = region.provinces ?? [];
  const disabledSet = new Set(region.disabledProvinces ?? []);

  const isAll = disabledSet.size === 0 && allProvinces.length > 0;
  const isNone = disabledSet.size === allProvinces.length;
  const indeterminate = !isAll && !isNone;

  const applyChange = (next: Set<string>) => {
    onChange(allProvinces.filter((p) => next.has(p)));
  };

  const toggle = (prov: string, checked: boolean) => {
    const next = new Set(disabledSet);
    if (checked) next.delete(prov);
    else next.add(prov);
    applyChange(next);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        className="region-toggle flex items-center gap-3 px-4 py-3 transition-colors w-full text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className="font-medium text-gray-800 text-sm">
          📍 {region.name}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          <label className="province-check font-semibold mb-2 bg-blue-50">
            <input
              type="checkbox"
              checked={isAll}
              ref={(el) => {
                if (el) el.indeterminate = indeterminate;
              }}
              onChange={(e) => {
                const next = e.target.checked
                  ? new Set<string>()
                  : new Set(allProvinces);
                applyChange(next);
              }}
            />
            Toda la región ({allProvinces.length} provincias)
          </label>

          <div className="province-grid">
            {allProvinces.map((prov) => (
              <label key={prov} className="province-check">
                <input
                  type="checkbox"
                  checked={!disabledSet.has(prov)}
                  onChange={(e) => toggle(prov, e.target.checked)}
                />
                {prov}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountryCard({
  country,
  regions,
  onToggleEnabled,
  onRegionChange,
}: {
  country: {
    _id: string;
    name: string;
    flag: string;
    continent: string;
    enabled: boolean;
  };
  regions: DestinationRegion[];
  onToggleEnabled: (enabled: boolean) => void;
  onRegionChange: (region: DestinationRegion, disabledProvinces: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const totalProvinces = regions.reduce(
    (sum, r) => sum + (r.provinces?.length || 0),
    0,
  );

  return (
    <div className={`region-card ${country.enabled ? "" : "opacity-60"}`}>
      <div
        className="region-toggle flex items-center justify-between px-5 py-4 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-400 transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
          <span className="font-semibold text-gray-800 text-[15px]">
            {country.flag || "🏳️"} {country.name}
          </span>
          <span className="badge-counter">
            {regions.length} regiones · {totalProvinces} provincias
          </span>
        </div>
        <label
          className="province-check font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={country.enabled}
            onChange={(e) => {
              onToggleEnabled(e.target.checked);
              showToast(
                `${country.name} ${
                  e.target.checked ? "activado" : "desactivado"
                } en el catálogo`,
              );
            }}
          />
          Usar país
        </label>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {regions.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">
              Aún no hay regiones cargadas para este país.
            </p>
          )}
          {regions.map((region) => (
            <RegionCard
              key={region._id}
              region={region}
              onChange={(disabledProvinces) => onRegionChange(region, disabledProvinces)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManageDestinationsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: () => destinationsApi.findAllCountries(),
  });
  const regions = useQuery({
    queryKey: ["regions"],
    queryFn: () => destinationsApi.findRegions(),
  });

  // Regiones agrupadas por país (antes de cualquier early return)
  const regionsByCountry = useMemo(() => {
    const map = new Map<string, DestinationRegion[]>();
    for (const region of regions.data ?? []) {
      const key = region.country || "Perú";
      map.set(key, [...(map.get(key) ?? []), region]);
    }
    return map;
  }, [regions.data]);

  const continents = [
    ...new Set((countries.data ?? []).map((c) => c.continent)),
  ];

  const toggleCountry = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      destinationsApi.updateCountry(id, enabled),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["countries"],
        (
          old?: {
            _id: string;
            name: string;
            flag: string;
            continent: string;
            enabled: boolean;
          }[],
        ) => old?.map((c) => (c._id === updated._id ? updated : c)),
      );
    },
    onError: () => showToast("No se pudo guardar el país", "error"),
  });

  const updateRegion = useMutation({
    mutationFn: ({
      region,
      disabledProvinces,
    }: {
      region: DestinationRegion;
      disabledProvinces: string[];
    }) =>
      destinationsApi.updateRegion(region._id, {
        provinces: region.provinces ?? [],
        disabledProvinces,
      }),
    onSuccess: () => {
      showToast("Provincias guardadas");
      void queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Error al guardar la región",
        "error",
      );
    },
  });

  if (countries.isLoading || regions.isLoading) {
    return (
      <PageShell
        title="Destinos"
        subtitle="Países por continente: activa los países que uses y marca las regiones/provincias que ofrezcas."
      >
        <div className="bg-white rounded-xl shadow-sm p-6">
          <InlineSpinner text="Cargando destinos..." />
        </div>
      </PageShell>
    );
  }


  return (
    <PageShell
      title="Destinos"
      subtitle="Países por continente: activa los países que uses y marca las regiones/provincias que ofrezcas. Cada cambio se guarda al instante."
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        {continents.map((continent) => {
          const continentCountries = (countries.data ?? []).filter(
            (c) => c.continent === continent,
          );
          return (
            <div key={continent}>
              <div className="continent-heading">
                <span className="text-2xl">
                  {continent === "América" ? "🌎" : "🌍"}
                </span>
                <span className="continent-name">{continent}</span>
                <div className="continent-line" />
              </div>
              <div className="space-y-4">
                {continentCountries.map((country) => (
                  <CountryCard
                    key={country._id}
                    country={country}
                    regions={regionsByCountry.get(country.name) ?? []}
                    onToggleEnabled={(enabled) =>
                      toggleCountry.mutate({ id: country._id, enabled })
                    }
                    onRegionChange={(region, disabledProvinces) =>
                      updateRegion.mutate({ region, disabledProvinces })
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
