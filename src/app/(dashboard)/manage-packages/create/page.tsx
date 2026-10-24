"use client";

import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PackageWizard } from "@/components/packages/PackageWizard";

export default function CreatePackagePage() {
  return (
    <PageShell
      title="Crear Paquete"
      subtitle="Completa los pasos para publicar tu paquete turístico"
    >
      <Suspense>
        <WizardWithQuery />
      </Suspense>
    </PageShell>
  );
}

function WizardWithQuery() {
  return <PackageWizard />;
}
