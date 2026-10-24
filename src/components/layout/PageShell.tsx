"use client";

import type { ReactNode } from "react";
import { Header } from "./Header";
import { useSidebarToggle } from "./SidebarToggleContext";

/**
 * Envoltura compartida para las páginas del dashboard:
 * header con título/subtítulo + zona de contenido.
 */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const toggle = useSidebarToggle();
  return (
    <>
      <Header title={title} subtitle={subtitle} onMenuToggle={toggle} />
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}
