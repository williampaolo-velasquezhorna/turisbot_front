"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import { AuthSplit, AuthLoadingOverlay } from "@/components/auth/AuthSplit";
import { Field, PasswordInput } from "@/components/ui/Form";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/lib/api/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") || "/panel";
  const confirmed = searchParams.get("confirmed") === "true";
  const reset = searchParams.get("reset") === "true";

  // Estado derivado de la URL (confirmación de correo / reset de contraseña)
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(() =>
    confirmed
      ? {
          message: "¡Correo confirmado exitosamente! Ya puedes iniciar sesión.",
          type: "success" as const,
        }
      : reset
        ? {
            message:
              "¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.",
            type: "success" as const,
          }
        : null,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const data = await authApi.login({ usernameOrEmail, password });
      setSession(data.access_token, data.user);
      router.push(next);
    } catch (error) {
      setAlert({
        message:
          error instanceof Error ? error.message : "Error al iniciar sesión",
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <AuthLoadingOverlay message="¡Inicio de sesión exitoso! Redirigiendo..." />
      )}

      <div className="bg-white lg:max-w-md lg:mx-0 mx-auto py-4">
        <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h1>
        <p className="text-sm text-gray-500 mb-6">
          Bienvenido de nuevo, ingresa tus datos
        </p>

        {alert && (
          <div
            className={`auth-alert ${
              alert.type === "error" ? "auth-alert-error" : "auth-alert-success"
            }`}
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Field label="Correo electrónico o usuario">
            <input
              type="text"
              required
              autoFocus
              className="auth-input"
              placeholder="Ingresa tu correo o usuario"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />
          </Field>

          <Field label="Contraseña">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
            />
          </Field>

          <div className="auth-flex-between">
            <label className="auth-checkbox-wrapper">
              <input type="checkbox" className="auth-checkbox" />
              <span className="auth-checkbox-label">Recordarme</span>
            </label>
            <Link href="/forgot-password" className="auth-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-btn gradient-btn"
            disabled={loading}
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="auth-link font-semibold">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthSplit
      headline="Atiende a tus clientes 24/7 y convierte más conversaciones en reservas."
      features={[
        {
          icon: "💬",
          title: "Respuestas al instante",
          text: "Tu asesor virtual responde primero, siempre.",
        },
        {
          icon: "📅",
          title: "Reservas automáticas",
          text: "Sin trabajo manual ni cotizaciones repetidas.",
        },
        {
          icon: "📈",
          title: "Menos trabajo, más ventas",
          text: "Todo tu CRM de paquetes y reservas en un panel.",
        },
      ]}
      quote="Combinamos tecnología e innovación turística para transformar la manera en que las agencias venden en Latinoamérica."
    >
      <Suspense>
        <LoginContent />
      </Suspense>
    </AuthSplit>
  );
}
