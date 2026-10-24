import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/panel",
  "/manage-packages",
  "/manage-destinations",
  "/manage-service-types",
  "/profile",
];

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("tb_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isProtected && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (isAuthRoute && token && pathname !== "/confirm-email") {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/manage-packages/:path*",
    "/manage-destinations/:path*",
    "/manage-service-types/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/confirm-email",
  ],
};
