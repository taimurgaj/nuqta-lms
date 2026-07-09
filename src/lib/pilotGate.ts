// Shared pilot access gate. Test-run (demo-tier org) sessions never touch
// this — see middleware.ts. Everyone else (real pilot orgs, registration,
// API routes) needs to have unlocked this gate once, via /gate, before
// reaching anything. Uses Web Crypto (crypto.subtle) so the same code runs
// unchanged in both the edge-runtime middleware and the Node-runtime /api/gate
// route — no Node-only `crypto` module dependency.

export const GATE_COOKIE = "nuqta_pilot_gate";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// The cookie never stores the plaintext password — just a token derived from
// it plus NEXTAUTH_SECRET, so a leaked cookie value can't be reversed into
// the password, and can't be forged without knowing both.
export async function computeGateToken(): Promise<string> {
  const password = process.env.PILOT_GATE_PASSWORD;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!password || !secret) {
    throw new Error("PILOT_GATE_PASSWORD and NEXTAUTH_SECRET must both be set");
  }
  return sha256Hex(`${password}:${secret}`);
}

export async function checkGatePassword(attempt: string): Promise<boolean> {
  return attempt === process.env.PILOT_GATE_PASSWORD;
}

export async function isGateCookieValid(cookieValue: string | undefined | null): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await computeGateToken();
  return cookieValue === expected;
}
