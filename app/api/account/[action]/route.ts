import { NextResponse } from "next/server";
import { accountKey, callAccount, forget, respond } from "@/lib/account";

// Area utente: il browser parla con questo indirizzo, che inoltra al backend col codice di accesso del cookie.
const POSTS: Record<string, string> = {
  register: "/register/",
  verify: "/verify/",
  login: "/login/",
  logout: "/logout/",
  forgot: "/password/forgot/",
  reset: "/password/reset/",
  "from-order": "/from-order/",
};

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const path = POSTS[action];
  if (!path) return NextResponse.json({ error: "Richiesta non valida." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const key = await accountKey();
  const { status, data } = await callAccount(path, { method: "POST", body, key, req });
  if (action === "logout") return forget(NextResponse.json({ ok: true }));
  return respond(status, data);
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== "me") return NextResponse.json({ error: "Richiesta non valida." }, { status: 404 });
  const key = await accountKey();
  if (!key) return NextResponse.json({ error: "Non hai effettuato l'accesso." }, { status: 401 });
  const cassa = new URL(req.url).searchParams.get("cassa") === "1";
  const { status, data } = await callAccount(`/me/${cassa ? "?cassa=1" : ""}`, { key, req });
  const res = NextResponse.json(data, { status });
  return status === 401 ? forget(res) : res;
}
