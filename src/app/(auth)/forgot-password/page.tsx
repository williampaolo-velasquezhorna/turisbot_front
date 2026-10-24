"use client";

import Link from "next/link";
import { Copyright } from "@/components/ui/Copyright";
import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/components/ui/Form";
import { authApi } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/utils";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const data = await authApi.forgotPassword({ email });
      setAlert({ message: data.message, type: "success" });
      setEmail("");
    } catch (error) {
      setAlert({
        message: getErrorMessage(error, "Error al enviar el correo"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container gradient-bg">
      <div className="auth-card">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="gradient-btn auth-header">
            <div className="auth-header-icon">
              <span aria-hidden="true">🔑</span>
            </div>
            <h1 className="auth-header-title">TurisBot</h1>
            <p className="auth-header-subtitle">Recuperar contraseña</p>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">¿Olvidaste tu contraseña?</h2>
            <p className="auth-subtitle">
              Ingresa tu correo electrónico y te enviaremos instrucciones para
              restablecerla.
            </p>

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
              <Field label="Correo electrónico">
                <input
                  type="email"
                  required
                  autoFocus
                  className="auth-input"
                  placeholder="juan@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <button
                type="submit"
                className="auth-btn gradient-btn"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Instrucciones"}
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
