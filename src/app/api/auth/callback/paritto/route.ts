import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/paritto-auth";
import { cookies } from "next/headers";

export const PARITTO_ACCESS_TOKEN_COOKIE = "paritto_access_token";
export const PARITTO_REFRESH_TOKEN_COOKIE = "paritto_refresh_token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log("[callback] params:", Object.fromEntries(searchParams));
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_error", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("paritto_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=state_mismatch", request.url));
  }

  const codeVerifier = cookieStore.get("paritto_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=missing_verifier", request.url));
  }

  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://yarukoto.paritto.dev/api/auth/callback/paritto"
      : "http://localhost:3000/api/auth/callback/paritto";

  try {
    const tokens = await exchangeCode(code, redirectUri, codeVerifier);

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.delete("paritto_oauth_state");
    response.cookies.delete("paritto_code_verifier");

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
  } catch (err) {
    console.error("[paritto-auth] token exchange error:", err);
    if (err instanceof Error) {
      console.error("message:", err.message);
    }
    return NextResponse.redirect(new URL("/login?error=oauth_exchange_failed", request.url));
  }
}
