import { jwtVerify, createRemoteJWKSet } from "jose";

const PARITTO_AUTH_URL = process.env.PARITTO_AUTH_URL!;
const CLIENT_ID = process.env.PARITTO_CLIENT_ID!;
const CLIENT_SECRET = process.env.PARITTO_CLIENT_SECRET!;

const JWKS = createRemoteJWKSet(new URL(`${PARITTO_AUTH_URL}/.well-known/jwks.json`));

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: PARITTO_AUTH_URL,
    audience: CLIENT_ID,
  });
  return payload as {
    sub: string;
    email: string;
    name?: string;
    scope: string;
    aud: string;
  };
}

export function buildAuthorizationUrl(state: string, redirectUri: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${PARITTO_AUTH_URL}/api/auth/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${PARITTO_AUTH_URL}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${PARITTO_AUTH_URL}/api/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }

  return res.json();
}
