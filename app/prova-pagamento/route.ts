import { NextResponse, type NextRequest } from "next/server";
import { TEST_PAYMENT_COOKIE, previewCode, setPreviewCookies, privateCheckoutSecret } from "@/lib/shop";

// PROVVISORIO (20/11/2026): link per provare l'acquisto senza carta. Apre lo shop (come il link degli amici)
// e, solo in questo browser, mostra «Pagamento di prova» in cassa. Codice sbagliato o variabile assente: home.
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.search = "";
  url.pathname = "/";
  const secret = privateCheckoutSecret();
  const preview = previewCode();
  if (!secret || req.nextUrl.searchParams.get("codice")?.trim() !== secret) return NextResponse.redirect(url, 307);
  url.pathname = "/shop";
  if (preview) url.searchParams.set("codice", preview);
  const res = NextResponse.redirect(url, 307);
  const secure = req.nextUrl.protocol === "https:";
  res.cookies.set(TEST_PAYMENT_COOKIE, secret, { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 7 * 86400 });
  if (preview) setPreviewCookies(res.cookies, preview, secure);
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
