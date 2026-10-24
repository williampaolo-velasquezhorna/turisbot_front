"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { GlobeIcon, MapPinIcon } from "@/components/ui/icons";
import { packagesApi } from "@/lib/api/packages";
import { destinationsApi } from "@/lib/api/destinations";

function StatCard({
  label,
  value,
  accent,
  icon,
  href,
  hrefLabel,
  disabled,
  loading,
}: {
  label: string;
  value: string | number | null;
  accent: "blue" | "green" | "orange";
  icon: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const accentClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  }[accent];

  if (loading) {
    return <StatCardSkeleton />;
  }

  const inner = (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${
        disabled ? "opacity-50" : ""
      } ${href && !disabled ? "lg:hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${accentClasses}`}
        >
          {icon}
        </div>
      </div>
      {href && !disabled && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            {hrefLabel} →
          </span>
        </div>
      )}
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export default function PanelPage() {
  const packagesCount = useQuery({
    queryKey: ["packages", "total"],
    queryFn: () => packagesApi.list({ limit: 1, page: 1 }),
  });
  const regionsCount = useQuery({
    queryKey: ["regions"],
    queryFn: () => destinationsApi.findRegions(),
  });

  return (
    <PageShell title="Panel de Control" subtitle="Resumen general de TurisBot">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Paquetes"
          value={
            packagesCount.isFetching ? null : packagesCount.data?.total ?? 0
          }
          accent="blue"
          icon={<GlobeIcon className="w-6 h-6" />}
          href="/manage-packages"
          hrefLabel="Ver todos"
          loading={packagesCount.isLoading || packagesCount.isFetching}
        />
        <StatCard
          label="Destinos"
          value={
            regionsCount.isFetching ? null : regionsCount.data?.length ?? 0
          }
          accent="blue"
          icon={<MapPinIcon className="w-6 h-6" />}
          href="/manage-destinations"
          hrefLabel="Ver todos"
          loading={regionsCount.isLoading || regionsCount.isFetching}
        />
        <StatCard
          label="Reservas"
          value="-"
          accent="green"
          icon={<GlobeIcon className="w-6 h-6" />}
          disabled
        />
        <StatCard
          label="Usuarios"
          value="-"
          accent="orange"
          icon={<GlobeIcon className="w-6 h-6" />}
          disabled
        />
      </div>

      {/* Acciones rápidas */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/manage-packages/create"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">+</span>
            </div>
            <div>
              <p className="font-medium text-gray-800">Añadir</p>
              <p className="text-sm text-gray-500">
                Agregar un nuevo paquete turístico
              </p>
            </div>
          </Link>
          <Link
            href="/manage-packages"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
              🌍
            </div>
            <div>
              <p className="font-medium text-gray-800">Listado de paquetes</p>
              <p className="text-sm text-gray-500">
                Administrar los paquetes existentes
              </p>
            </div>
          </Link>
          <Link
            href="/manage-service-types"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
              🧩
            </div>
            <div>
              <p className="font-medium text-gray-800">Tipos de Servicio</p>
              <p className="text-sm text-gray-500">
                Administrar los tipos de servicio
              </p>
            </div>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
