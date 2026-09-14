import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if requesting an admin route: /en/admin, /ar/admin, /fr/admin, or /admin
  const isAdminRoute = /\/(?:en|ar|fr)?\/?admin(?:\/.*)?$/.test(pathname);

  if (isAdminRoute) {
    const token = await getToken({
      req,
      secret:
        process.env.NEXTAUTH_SECRET || "egyrock_dev_super_secret_jwt_key_at_least_32_characters",
    });

    const segments = pathname.split("/").filter(Boolean);
    const currentLocale = routing.locales.includes(segments[0] as any)
      ? segments[0]
      : routing.defaultLocale;

    // 1. If unauthenticated -> redirect to login with callbackUrl
    if (!token) {
      const loginUrl = new URL(`/${currentLocale}/auth/login`, req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. If authenticated but NOT admin -> block and redirect to account
    if (token.role !== "admin") {
      const accountUrl = new URL(`/${currentLocale}/account`, req.url);
      accountUrl.searchParams.set("error", "unauthorized_admin_required");
      return NextResponse.redirect(accountUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all internationalized routes, skipping Next.js internals, static images, and api
  matcher: ["/", "/(ar|en|fr)/:path*", "/((?!_next|_vercel|images|icons|api|.*\\..*).*)"],
};
