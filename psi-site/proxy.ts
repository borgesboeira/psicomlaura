import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthedFromCookie } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app")) {
    const ok = isAuthedFromCookie(req.headers.get("cookie"));
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
