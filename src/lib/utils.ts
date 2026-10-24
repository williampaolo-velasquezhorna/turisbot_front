export type ToastType = "success" | "error";

export function getErrorMessage(
  data: unknown,
  fallback = "Ocurrió un error",
): string {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }
  return fallback;
}

export function fullName(user: {
  nombres: string;
  apellidos?: string;
}): string {
  return `${user.nombres} ${user.apellidos ?? ""}`.trim();
}

export function userInitials(user: {
  nombres: string;
  apellidos?: string;
}): string {
  const first = user.nombres?.[0] ?? "";
  const second = user.apellidos?.[0] ?? "";
  return `${first}${second}`.toUpperCase() || "U";
}
