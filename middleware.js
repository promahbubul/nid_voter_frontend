import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "nid_session";

export function middleware(request) {
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    if (hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (pathname === "/login" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  if ((pathname.startsWith("/overview") || pathname.startsWith("/records")) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/overview/:path*", "/records/:path*"],
};
