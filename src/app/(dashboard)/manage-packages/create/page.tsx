"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PackageWizard } from "@/components/packages/PackageWizard";

export default function CreatePackagePage() {
  return (
    <Suspense>
      <WizardPage />
    </Suspense>
  );
}

function WizardPage() {
  // Título dinámico según el modo: con ?id= es edición
  const editingId = useSearchParams().get("id");
  const isEdit = !!editingId;

  return (
    <PageShell
      title={isEdit ? "Editar Paquete" : "Crear Paquete"}
      subtitle={
        isEdit
          ? "Actualiza los datos y guarda los cambios de tu paquete"
          : "Completa los pasos para publicar tu paquete turístico"
      }
    >
      <PackageWizard />
    </PageShell>
  );
}
