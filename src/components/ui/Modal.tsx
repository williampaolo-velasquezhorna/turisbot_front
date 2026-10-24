"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  /** max-width en tailwind, ej 'max-w-md' | 'max-w-6xl' */
  size?: string;
  /** desplaza el overlay a la derecha del sidebar en desktop */
  sidebarOffset?: boolean;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  size = "max-w-lg",
  sidebarOffset = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`modal-overlay fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 lg:left-80 ${
        sidebarOffset ? "" : "lg:left-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-content bg-white rounded-2xl p-6 w-full ${size} max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
