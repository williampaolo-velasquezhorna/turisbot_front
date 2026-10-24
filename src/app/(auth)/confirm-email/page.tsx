"use client";

import Link from "next/link";
import { Copyright } from "@/components/ui/Copyright";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { AlertIcon, CheckCircleIcon, Spinner } from "@/components/ui/icons";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // Estado inicial derivado de la URL
  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error",
  );
  const [error, setError] = useState(
    "El enlace de confirmación es inválido o ha expirado.",
  );

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authApi
      .confirmEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Error al confirmar el correo.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const missingTokenError = "No se proporcionó un token de confirmación.";
  const shownError = token ? error : missingTokenError;

  return (
    <div className="auth-container gradient-bg">
      <div className="auth-card">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="gradient-btn auth-header">
            <div className="auth-header-icon">
              <span aria-hidden="true">✉️</span>
            </div>
            <h1 className="auth-header-title">TurisBot</h1>
            <p className="auth-header-subtitle">Confirmación de correo</p>
          </div>

          <div className="auth-body text-center">
            {status === "loading" && (
              <div className="py-8">
                <Spinner className="h-12 w-12 text-[#1976d2]" />
                <p className="mt-4 text-gray-600">Verificando tu correo...</p>
              </div>
            )}

            {status === "success" && (
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="auth-title mb-2">¡Correo Confirmado!</h2>
                <p className="auth-subtitle mb-6">
                  Tu correo electrónico ha sido verificado exitosamente. Ya
                  puedes iniciar sesión.
                </p>
                <Link
                  href="/login?confirmed=true"
                  className="auth-btn gradient-btn inline-block"
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            )}

            {status === "error" && (
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                  <AlertIcon className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="auth-title mb-2">Error de Confirmación</h2>
                <p className="auth-subtitle mb-6">{shownError}</p>
                <Link
                  href="/login"
                  className="auth-btn gradient-btn inline-block"
                >
                  Volver a Iniciar Sesión
                </Link>
              </div>
            )}
          </div>
        </div>

        <Copyright className="auth-copyright" />
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}
