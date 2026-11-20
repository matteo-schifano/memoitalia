import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Area utente (20/11/2026). Il codice di accesso sta in un cookie che il browser non può leggere (httpOnly):
// le pagine e le API del sito lo passano al backend come «Authorization: Bearer …».
export const ACCOUNT_COOKIE = "memo-account";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni, come l'accesso sul backend

const BASE = process.env.BACKEND_URL?.replace(/\/$/, "");

export type AccountOrder = {
  number: string;
  token: string;
  placedAt: string;
  label: string;
  totalCents: number;
  items: { id: string; name: string; qty: number }[];
  trackingUrl: string;
  /** tappa del pacco: 0 Ordinato, 1 In preparazione, 2 Partito, 3 Consegnato; null se annullato */
  stage: number | null;
};

export type AccountBadge = { key: string; name: string; text: string; earned: boolean; progress: string };
export type AccountStats = { boxes: number; orders: number; flavors: number };

export type AccountProfile = { email: string; firstName: string; lastName: string };

export type CheckoutProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: { line1: string; line2: string; postcode: string; city: string; province: string } | null;
  billing: {
    company: boolean;
    name: string;
    vatNumber: string;
    taxCode: string;
    sdiCode: string;
    pec: string;
    address: { line1: string; postcode: string; city: string; province: string } | null;
  } | null;
};

export async function accountKey() {
  return (await cookies()).get(ACCOUNT_COOKIE)?.value ?? "";
}

export async function callAccount(path: string, { method = "GET", body, key, req }: { method?: string; body?: unknown; key?: string; req?: Request } = {}) {
  if (!BASE) return { status: 503, data: { error: "Il negozio non è raggiungibile, riprova tra poco." } as Record<string, unknown> };
  try {
    const res = await fetch(`${BASE}/api/v1/account${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
        // i limiti di tentativi valgono per chi naviga, non per il server del sito
        ...(req ? { "X-Forwarded-For": req.headers.get("x-forwarded-for") ?? "" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok && !data.error) data.error = res.status === 429 ? "Troppi tentativi: riprova tra qualche minuto." : "Qualcosa non ha funzionato, riprova.";
    return { status: res.status, data };
  } catch {
    return { status: 503, data: { error: "Il negozio non è raggiungibile, riprova tra poco." } as Record<string, unknown> };
  }
}

// Risposta al browser: il codice di accesso finisce nel cookie, mai nel testo della risposta.
export function respond(status: number, data: Record<string, unknown>) {
  const { key, ...rest } = data;
  const res = NextResponse.json(rest, { status });
  if (typeof key === "string" && key) {
    res.cookies.set(ACCOUNT_COOKIE, key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }
  return res;
}

export function forget(res: NextResponse) {
  res.cookies.set(ACCOUNT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

// Per le pagine del sito: dati dell'area, o null se non si è entrati (o l'accesso è scaduto).
export async function getAccountArea(): Promise<{ account: AccountProfile; orders: AccountOrder[]; badges: AccountBadge[]; stats?: AccountStats } | null> {
  const key = await accountKey();
  if (!key) return null;
  const { status, data } = await callAccount("/me/", { key });
  if (status !== 200) return null;
  return data as unknown as { account: AccountProfile; orders: AccountOrder[]; badges: AccountBadge[]; stats?: AccountStats };
}

// Solo indirizzi interni al sito dopo l'accesso (niente «//altro-sito.it»).
export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}
