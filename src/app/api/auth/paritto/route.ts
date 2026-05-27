import { NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/paritto-auth";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/paritto-pkce";

export async function GET() {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? "https://yarukoto.paritto.dev/api/auth/callback/paritto"
      : "http://localhost:3000/api/auth/callback/paritto";

  const authUrl = buildAuthorizationUrl(state, redirectUri, codeChallenge);

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("paritto_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  response.cookies.set("paritto_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
