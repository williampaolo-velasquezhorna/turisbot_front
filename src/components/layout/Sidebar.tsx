"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDownIcon,
  DashboardIcon,
  GlobeIcon,
  MapPinIcon,
} from "../ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/panel", label: "Panel de Control", icon: <DashboardIcon /> },
  {
    href: "/manage-packages",
    label: "Paquetes Turísticos",
    icon: <GlobeIcon />,
    children: [
      { href: "/manage-packages", label: "Listado de paquetes" },
      { href: "/manage-packages/create", label: "Crear Paquete" },
      { href: "/manage-service-types", label: "Tipos de Servicio" },
    ],
  },
  {
    href: "/manage-destinations",
    label: "Destinos",
    icon: <MapPinIcon />,
  },
];

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Coincidencia exacta para los elementos del submenú */
function isChildActive(href: string, pathname: string): boolean {
  return pathname === href;
}

export function Sidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [packagesOpen, setPackagesOpen] = useState(true);

  return (
    <aside
      className={`w-80 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">TurisBot</h1>
            <p className="text-xs text-white/70">Panel de Administración</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-white/10 ${
                    active ? "bg-white/15 border-l-[3px] border-white" : ""
                  } border-l-[3px] border-transparent`}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 flex-1"
                    onClick={onNavigate}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      aria-label="Ocultar o mostrar submenú"
                      onClick={() => setPackagesOpen((o) => !o)}
                      className="text-white/70 hover:text-white"
                    >
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${
                          packagesOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  )}
                </div>
                {item.children && packagesOpen && (
                  <div className="mt-1 ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={`block rounded-lg px-4 py-1.5 ml-4 text-sm transition-all hover:bg-white/10 ${
                          isChildActive(child.href, pathname)
                            ? "text-white font-semibold"
                            : "text-white/75"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
