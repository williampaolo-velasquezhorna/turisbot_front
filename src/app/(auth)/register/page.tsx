"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import {
  AuthSplit,
  AuthLoadingOverlay,
} from "@/components/auth/AuthSplit";
import { Field, PasswordInput } from "@/components/ui/Form";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/utils";

function RegisterContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setAlert({ message: "Las contraseñas no coinciden", type: "error" });
      return;
    }
    setAlert(null);
    setLoading(true);
    try {
      await authApi.register({
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
        username: form.username,
        password: form.password,
      });
      // Éxito: mostrar overlay y redirigir al login
      setTimeout(() => router.push("/login"), 3000);
      setAlert({
        message: "¡Cuenta creada! Revisa tu correo para confirmarla.",
        type: "success",
      });
    } catch (error) {
      setAlert({
        message: getErrorMessage(error, "Error al registrarse"),
        type: "error",
      });
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <AuthLoadingOverlay message="¡Cuenta creada! Redirigiendo..." />
      )}
      <div className="bg-white lg:max-w-md lg:mx-0 mx-auto py-4">
        <h1 className="text-2xl font-bold text-slate-900">Crear Cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Registra tu agencia y empieza a vender más
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
          <div className="auth-form-row">
            <Field label="Nombres">
              <input
                type="text"
                required
                autoFocus
                className="auth-input"
                placeholder="Juan"
                value={form.nombres}
                onChange={set("nombres")}
              />
            </Field>
            <Field label="Apellidos">
              <input
                type="text"
                required
                className="auth-input"
                placeholder="Pérez"
                value={form.apellidos}
                onChange={set("apellidos")}
              />
            </Field>
          </div>

          <Field label="Correo electrónico">
            <input
              type="email"
              required
              className="auth-input"
              placeholder="juan@ejemplo.com"
              value={form.email}
              onChange={set("email")}
            />
          </Field>

          <Field label="Nombre de usuario">
            <input
              type="text"
              required
              className="auth-input"
              placeholder="juanperez"
              value={form.username}
              onChange={set("username")}
            />
          </Field>

          <Field label="Contraseña">
            <PasswordInput
              value={form.password}
              onChange={set("password")}
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </Field>

          <Field label="Confirmar contraseña">
            <PasswordInput
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              minLength={6}
              placeholder="Repite tu contraseña"
            />
          </Field>

          <div className="auth-checkbox-wrapper">
            <input
              type="checkbox"
              id="terms"
              required
              className="auth-checkbox"
            />
            <label htmlFor="terms" className="auth-checkbox-label">
              Acepto los{" "}
              <a href="#" className="auth-link">
                términos y condiciones
              </a>{" "}
              y la{" "}
              <a href="#" className="auth-link">
                política de privacidad
              </a>
            </label>
          </div>

          <button
            type="submit"
            className="auth-btn gradient-btn"
            disabled={loading}
          >
            Crear Cuenta
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="auth-link font-semibold">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthSplit
      headline="Crea tu cuenta y comienza a convertir más conversaciones en reservas."
      features={[
        {
          icon: "⚙️",
          title: "Configura en minutos",
          text: "Servicios, horarios, precios y políticas de tu agencia.",
        },
        {
          icon: "🧠",
          title: "IA que entiende a tus clientes",
          text: "Recomienda destinos y responde como un asesor experto.",
        },
        {
          icon: "🎯",
          title: "Seguimiento automático",
          text: "Califica y acompaña a cada cliente sin perder oportunidades.",
        },
      ]}
      quote="Tu agencia, siempre disponible. Tus clientes, siempre atendidos."
    >
      <Suspense>
        <RegisterContent />
      </Suspense>
    </AuthSplit>
  );
}
