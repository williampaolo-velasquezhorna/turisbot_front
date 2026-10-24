"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { userInitials } from "@/lib/utils";
import { MenuIcon } from "../ui/icons";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" ref={menuRef}>
            <div
              className="profile-menu relative cursor-pointer select-none flex items-center gap-2"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user ? userInitials(user) : "U"}
                </span>
              </div>
              <span className="text-gray-700 font-medium">
                {user?.nombres ?? "Usuario"}
              </span>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-40">
                  <Link
                    href="/profile"
                    className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    👤 Mi Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Abrir menú"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors ml-2"
            >
              <MenuIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
