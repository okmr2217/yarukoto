// Node.js Runtime 専用（Route Handler からのみインポートすること）
import crypto from "node:crypto";

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  const digest = crypto.createHash("sha256").update(verifier).digest();
  return Buffer.from(digest).toString("base64url");
}
