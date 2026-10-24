import { getErrorMessage } from "../utils";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3978/api";

export const TOKEN_COOKIE = "tb_token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setTokenCookie(token: string | null): void {
  if (token) {
    document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(
      token,
    )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined> | object;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, query, auth = false }: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "")
        url.searchParams.set(key, String(value));
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Error de conexión. Por favor, intenta de nuevo.", 0);
  }

  if (response.status === 401) {
    // Sesión inválida o expirada: limpiar y redirigir al login
    setTokenCookie(null);
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new ApiError("Sesión expirada", 401);
  }

  const data = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Error ${response.status}`),
      response.status,
    );
  }
  return data as T;
}
