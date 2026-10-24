"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Field, PasswordInput } from "@/components/ui/Form";
import { useAuth } from "@/components/providers/AuthProvider";
import { usersApi } from "@/lib/api/users";

type Feedback = { message: string; type: "success" | "error" | "info" } | null;

const feedbackClass = {
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    username: "",
  });
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const setProfileField =
    (key: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfile((f) => ({ ...f, [key]: e.target.value }));

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileFeedback({ message: "Guardando...", type: "info" });
    setProfileLoading(true);
    try {
      const data = await usersApi.updateProfile({
        nombres: profile.nombres.trim(),
        apellidos: profile.apellidos.trim(),
        email: profile.email.trim(),
        username: profile.username.trim(),
      });
      if (user) updateUser({ ...user, ...data.user });
      setProfileFeedback({
        message: data.message || "Perfil actualizado correctamente",
        type: "success",
      });
    } catch (error) {
      setProfileFeedback({
        message: error instanceof Error ? error.message : "Error de conexión",
        type: "error",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setPasswordFeedback({
        message: "Las contraseñas nuevas no coinciden",
        type: "error",
      });
      return;
    }
    setPasswordFeedback({ message: "Actualizando...", type: "info" });
    setPasswordLoading(true);
    try {
      const data = await usersApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordFeedback({
        message: data.message || "Contraseña actualizada correctamente",
        type: "success",
      });
    } catch (error) {
      setPasswordFeedback({
        message: error instanceof Error ? error.message : "Error de conexión",
        type: "error",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PageShell title="Mi Perfil" subtitle="Actualiza tus datos o tu contraseña">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Datos personales */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Datos personales
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Estos datos se usan para tu cuenta y el correo del sistema.
          </p>

          {profileFeedback && (
            <p
              className={`text-sm font-medium rounded-lg px-3 py-2 mb-4 ${
                feedbackClass[profileFeedback.type]
              }`}
            >
              {profileFeedback.message}
            </p>
          )}

          <form
            onSubmit={handleProfileSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Nombres" required>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Juan"
                defaultValue={user?.nombres ?? ""}
                onChange={setProfileField("nombres")}
              />
            </Field>
            <Field label="Apellidos" required>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Pérez"
                defaultValue={user?.apellidos ?? ""}
                onChange={setProfileField("apellidos")}
              />
            </Field>
            <Field label="Correo electrónico" required>
              <input
                type="email"
                required
                className="form-input"
                placeholder="juan@ejemplo.com"
                defaultValue={user?.email ?? ""}
                onChange={setProfileField("email")}
              />
            </Field>
            <Field label="Usuario" required>
              <input
                type="text"
                required
                className="form-input"
                placeholder="juanperez"
                defaultValue={user?.username ?? ""}
                onChange={setProfileField("username")}
              />
            </Field>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Cambiar contraseña
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Ingresa tu contraseña actual para confirmar el cambio.
          </p>

          {passwordFeedback && (
            <p
              className={`text-sm font-medium rounded-lg px-3 py-2 mb-4 ${
                feedbackClass[passwordFeedback.type]
              }`}
            >
              {passwordFeedback.message}
            </p>
          )}

          <form
            onSubmit={handlePasswordSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <Field label="Contraseña actual" required>
                <PasswordInput
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  inputClassName="form-input auth-input-password"
                  required
                />
              </Field>
            </div>
            <Field label="Nueva contraseña" required>
              <PasswordInput
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                }
                minLength={6}
                autoComplete="new-password"
                inputClassName="form-input auth-input-password"
                required
              />
            </Field>
            <Field label="Confirmar nueva contraseña" required>
              <PasswordInput
                value={passwords.confirmNewPassword}
                onChange={(e) =>
                  setPasswords((p) => ({
                    ...p,
                    confirmNewPassword: e.target.value,
                  }))
                }
                minLength={6}
                autoComplete="new-password"
                inputClassName="form-input auth-input-password"
                required
              />
            </Field>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
