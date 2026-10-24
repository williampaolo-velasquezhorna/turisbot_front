"use client";

import Link from "next/link";
import { Copyright } from "@/components/ui/Copyright";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { Field, PasswordInput } from "@/components/ui/Form";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/utils";
import { ArrowLeftIcon } from "@/components/ui/icons";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setAlert({ message: "Las contraseñas no coinciden", type: "error" });
      return;
    }
    setAlert(null);
    setLoading(true);
    try {
      const data = await authApi.resetPassword({ token, password });
      setAlert({ message: `${data.message} Redirigiendo...`, type: "success" });
      setTimeout(() => router.push("/login?reset=true"), 2000);
    } catch (error) {
      setAlert({
        message: getErrorMessage(error, "Error al restablecer la contraseña"),
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <div className="auth-container gradient-bg">
      <div className="auth-card">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="gradient-btn auth-header">
            <div className="auth-header-icon">
              <span aria-hidden="true">🔐</span>
            </div>
            <h1 className="auth-header-title">TurisBot</h1>
            <p className="auth-header-subtitle">Nueva contraseña</p>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">Restablecer Contraseña</h2>
            <p className="auth-subtitle">Ingresa tu nueva contraseña.</p>

            {alert && (
              <div
                className={`auth-alert ${
                  alert.type === "error"
                    ? "auth-alert-error"
                    : "auth-alert-success"
                }`}
              >
                {alert.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <Field label="Nueva contraseña">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </Field>

              <Field label="Confirmar nueva contraseña">
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
              </Field>

              <button
                type="submit"
                className="auth-btn gradient-btn"
                disabled={loading}
              >
                {loading ? "Restableciendo..." : "Restablecer Contraseña"}
              </button>
            </form>

            <Link href="/login" className="auth-back-link">
              <ArrowLeftIcon />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <Copyright className="auth-copyright" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
