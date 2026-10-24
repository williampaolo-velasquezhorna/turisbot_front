"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { Modal } from "@/components/ui/Modal";
import { InlineSpinner, ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  AlertIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
  ViewIcon,
} from "@/components/ui/icons";
import { packagesApi } from "@/lib/api/packages";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import type { Package } from "@/types";

function categoryLabel(value?: string): string {
  if (!value) return "";
  return (
    CATEGORY_LABELS[value]?.replace(/^[^\s]+\s/, "") ||
    value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ")
  );
}

/** Extrae la lista de categorías aplanando separadores por coma */
function categoriesOf(pkg: Package): string[] {
  return (
    Array.isArray(pkg.category) ? pkg.category : [pkg.category].filter(Boolean)
  )
    .flatMap((c) => String(c).split(/,\s*/))
    .filter(Boolean);
}

function PackageRow({
  pkg,
  index,
  onView,
  onDelete,
}: {
  pkg: Package;
  index: number;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
      <td className="py-3 px-4 text-gray-500">{index}</td>
      <td className="py-3 px-4 font-medium text-gray-800">{pkg.name}</td>
      <td className="py-3 px-4 text-center w-32">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onView}
            className="btn-icon btn-view"
            title="Ver"
          >
            <ViewIcon className="text-blue-500" />
          </button>
          <Link
            href={`/manage-packages/create?id=${pkg._id}`}
            className="btn-icon btn-edit"
            title="Editar"
          >
            <EditIcon className="text-blue-500" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="btn-icon btn-delete"
            title="Eliminar"
          >
            <TrashIcon className="text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`pagination-btn ${i + 1 === page ? "active" : ""}`}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        →
      </button>
    </div>
  );
}

function PackageDetailView({ pkg }: { pkg: Package }) {
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["service-types"],
    queryFn: () =>
      import("@/lib/api/service-types").then((m) => m.serviceTypesApi.list()),
  });
  const serviceTypeLabel =
    serviceTypes.find((t) => t.slug === pkg.serviceType)?.name ?? "—";

  const categories = categoriesOf(pkg).map(categoryLabel).filter(Boolean);
  const tagList = (items: string[] = [], empty = "Sin elementos") =>
    items.length ? (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="tag">
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-400">{empty}</p>
    );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900">{pkg.name}</h4>
            <p className="text-sm text-gray-500 mt-1">📍 {pkg.destination}</p>
            <p className="text-sm text-gray-500 mt-1">
              ⏱️ Duración: {pkg.duration}
            </p>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categories.map((c, i) => (
                  <span key={i} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
            {formatMoney(pkg.currency ?? "PEN", pkg.priceAmount ?? 0)}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-4 whitespace-pre-line">
          {pkg.description}
        </p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <dt className="text-gray-500">Dificultad</dt>
            <dd className="font-medium text-gray-800">
              {pkg.difficulty || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Temporada</dt>
            <dd className="font-medium text-gray-800">
              {pkg.bestSeason || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Edad</dt>
            <dd className="font-medium text-gray-800">
              {pkg.ageRequirement || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Grupo</dt>
            <dd className="font-medium text-gray-800">
              {pkg.groupSize ? `${pkg.groupSize} personas` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Tipo de servicio</dt>
            <dd className="font-medium text-gray-800">{serviceTypeLabel}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Punto de partida</dt>
            <dd className="font-medium text-gray-800">
              {pkg.departurePoint || "—"}
            </dd>
          </div>
        </dl>

        {(pkg.images ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-6">
            {(pkg.images ?? []).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img}
                alt="Imagen del paquete"
                className="rounded-lg object-cover border border-gray-200"
                style={{ width: 160, height: 160, maxWidth: 160 }}
              />
            ))}
          </div>
        )}
      </div>

      {(pkg.itinerary ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">
            Itinerario
          </h5>
          <ol className="text-sm text-gray-700 space-y-2">
            {(pkg.itinerary ?? []).map((d) => (
              <li key={d.day}>
                <span className="font-semibold">Día {d.day}:</span> {d.title}
                {d.description && (
                  <div className="whitespace-pre-line text-gray-600 mt-1">
                    {d.description}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-green-700 mb-3">
            Destacados
          </h5>
          {tagList(pkg.highlights)}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-blue-700 mb-3">Incluye</h5>
          {tagList(pkg.included)}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h5 className="text-sm font-semibold text-red-700 mb-3">
            No incluye
          </h5>
          {tagList(pkg.notIncluded)}
        </div>
      </div>
    </div>
  );
}

export default function ManagePackagesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Package | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["packages", { page, search: debouncedSearch, sortOrder }],
    queryFn: () =>
      packagesApi.list({
        page,
        limit: 10,
        sortBy: "name",
        sortOrder,
        search: debouncedSearch || undefined,
      }),
  });

  const limit = data?.limit ?? 10;
  const startRow = ((data?.page ?? page) - 1) * (data?.limit ?? 10);

  const findMutation = useQuery({
    queryKey: ["packages", viewingId],
    enabled: !!viewingId,
    queryFn: () => packagesApi.find(viewingId!),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagesApi.remove(id),
    onSuccess: () => {
      showToast("Paquete eliminado correctamente");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Error al eliminar",
        "error",
      );
    },
  });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const showEmpty = !isLoading && rows.length === 0;

  return (
    <PageShell
      title="Paquetes Turísticos"
      subtitle="Gestiona los paquetes turísticos de TurisBot"
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Listado de Paquetes
            </h3>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {data?.total ?? 0} paquetes
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="form-input pl-4 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link
              href="/manage-packages/create"
              className="btn-primary flex items-center gap-2 w-fit"
            >
              <PlusIcon />
              Nuevo Paquete
            </Link>
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <div className="text-center py-12 text-gray-500">
            Error al cargar los paquetes
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 w-16">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <button
                        type="button"
                        onClick={() =>
                          setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                        }
                        className="inline-flex items-center cursor-pointer hover:bg-gray-50 rounded"
                      >
                        Nombre
                        <span className="ml-2 opacity-80">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 w-32">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((pkg, i) => (
                    <PackageRow
                      key={pkg._id}
                      pkg={pkg}
                      index={startRow + i + 1}
                      onView={() => setViewingId(pkg._id)}
                      onDelete={() => setDeleting(pkg)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {showEmpty && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-gray-300 text-5xl">
                  📦
                </div>
                <p className="text-gray-500">
                  {debouncedSearch
                    ? `No se encontraron paquetes para "${debouncedSearch}"`
                    : "No hay paquetes registrados"}
                </p>
                {!debouncedSearch && (
                  <Link
                    href="/manage-packages/create"
                    className="btn-primary mt-4 inline-block"
                  >
                    Agregar primer paquete
                  </Link>
                )}
              </div>
            )}

            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modal vista */}
      <Modal
        open={!!viewingId}
        title="Vista del paquete"
        onClose={() => setViewingId(null)}
        size="max-w-6xl"
      >
        {findMutation.isLoading ? (
          <InlineSpinner text="Cargando paquete..." />
        ) : findMutation.data ? (
          <PackageDetailView pkg={findMutation.data} />
        ) : null}
      </Modal>

      {/* Modal eliminar */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="max-w-md"
        sidebarOffset={false}
      >
        <div className="text-center">
          <AlertIcon className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            ¿Eliminar paquete?
          </h3>
          <p className="text-gray-600 mb-6">
            {deleting ? `"${deleting.name}". ` : ""}Esta acción no se puede
            deshacer.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => deleting && deleteMutation.mutate(deleting._id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
