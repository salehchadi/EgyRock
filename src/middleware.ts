import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, skipping Next.js internals, static images, and api
  matcher: ["/", "/(ar|en|fr)/:path*", "/((?!_next|_vercel|images|icons|api|.*\\..*).*)"],
};
