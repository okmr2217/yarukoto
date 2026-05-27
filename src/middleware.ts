import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, refreshAccessToken } from "@/lib/paritto-auth";

const PARITTO_ACCESS_TOKEN_COOKIE = "paritto_access_token";
const PARITTO_REFRESH_TOKEN_COOKIE = "paritto_refresh_token";

const PUBLIC_PATHS = ["/login", "/register", "/signup", "/forgot-password", "/reset-password", "/api/auth", "/_next", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(PARITTO_ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(PARITTO_REFRESH_TOKEN_COOKIE)?.value;

  // Paritto Auth Cookie がない → 既存の better-auth セッションに委ねる
  if (!accessToken && !refreshToken) {
    return NextResponse.next();
  }

  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      return NextResponse.next();
    } catch {
      // 期限切れの可能性 → リフレッシュを試みる
    }
  }

  if (refreshToken) {
    try {
      const tokens = await refreshAccessToken(refreshToken);
      const response = NextResponse.next();

      response.cookies.set(PARITTO_ACCESS_TOKEN_COOKIE, tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in,
        path: "/",
      });
      response.cookies.set(PARITTO_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(PARITTO_ACCESS_TOKEN_COOKIE);
      response.cookies.delete(PARITTO_REFRESH_TOKEN_COOKIE);
      return response;
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(PARITTO_ACCESS_TOKEN_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
