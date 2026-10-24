"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { Field } from "@/components/ui/Form";
import { Modal } from "@/components/ui/Modal";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  AlertIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { serviceTypesApi } from "@/lib/api/service-types";
import type { ServiceType } from "@/types";

export default function ManageServiceTypesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<ServiceType | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<ServiceType | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useQuery({
    queryKey: ["service-types"],
    queryFn: () => serviceTypesApi.list(),
  });
  // Ordenamiento homólogo al listado de paquetes (por nombre, toggle)
  const serviceTypes = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) =>
        sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      ),
    [data, sortOrder],
  );

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; id?: string }) =>
      data.id
        ? serviceTypesApi.update(data.id, {
            name: data.name,
            description: data.description,
          })
        : serviceTypesApi.create({
            name: data.name,
            description: data.description,
          }),
    onSuccess: () => {
      showToast("Guardado correctamente");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["service-types"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Error al guardar",
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceTypesApi.remove(id),
    onSuccess: () => {
      showToast("Eliminado correctamente");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["service-types"] });
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : "Error al eliminar",
        "error",
      );
    },
  });

  const openEdit = (item: ServiceType) => {
    setEditing(item);
    setName(item.name);
    setDescription(item.description ?? "");
  };

  const openCreate = () => {
    setEditing("new");
    setName("");
    setDescription("");
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      id: editing === "new" ? undefined : editing?._id,
      name: name.trim(),
      description,
    });
  };

  return (
    <PageShell
      title="Tipos de Servicio"
      subtitle="Administra los tipos de servicio disponibles para los paquetes"
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Listado de tipo de servicio
          </h3>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <PlusIcon />
            Añadir
          </button>
        </div>

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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Descripción
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3}>
                    <ListSkeleton />
                  </td>
                </tr>
              ) : (
                serviceTypes.map((item, i) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.description || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="btn-icon btn-edit"
                          title="Editar"
                        >
                          <EditIcon className="text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(item)}
                          className="btn-icon btn-delete"
                          title="Eliminar"
                        >
                          <TrashIcon className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && serviceTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay tipos de servicio</p>
            <button type="button" onClick={openCreate} className="btn-primary">
              Añadir primer tipo
            </button>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === "new"
            ? "Añadir tipo de servicio"
            : "Editar Tipo de Servicio"
        }
        size="max-w-md"
      >
        <form onSubmit={handleSave}>
          <Field label="Nombre" required className="mb-4">
            <input
              type="text"
              required
              minLength={2}
              className="form-input"
              placeholder="Ej: Tour privado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Descripción" className="mb-6">
            <textarea
              rows={3}
              className="form-input"
              placeholder="Descripción opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
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
            ¿Eliminar tipo de servicio?
          </h3>
          <p className="text-gray-600 mb-6">
            Esta acción no se puede deshacer. Los paquetes que lo usen dejarán
            de tener un tipo asignado.
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
