import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const APP_ROUTES = [
  "/dashboard",
  "/contacts",
  "/avis",
  "/campagnes",
  "/parametres",
  "/facturation",
];

const isProtectedPath = (pathname: string) =>
  APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

const isLoginPath = (pathname: string) =>
  pathname === "/login" || pathname.startsWith("/login/");

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Keep /register accessible for authenticated users that still need onboarding.
  if (isLoginPath(pathname) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
