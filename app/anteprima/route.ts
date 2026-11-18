import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_DAYS, PREVIEW_FLAG_COOKIE, previewCode } from "@/lib/shop";

// Link segreto per gli ordini di prova: /anteprima?codice=… apre lo shop in questo browser e porta allo shop.
// /anteprima?esci=1 chiude l'anteprima. Codice sbagliato o anteprima spenta: si torna alla home.
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.search = "";
  url.pathname = "/";
  const code = previewCode();
  const params = req.nextUrl.searchParams;

  if (params.has("esci")) {
    const res = NextResponse.redirect(url, 307);
    res.cookies.delete(PREVIEW_COOKIE);
    res.cookies.delete(PREVIEW_FLAG_COOKIE);
    return res;
  }
  if (!code || params.get("codice")?.trim() !== code) return NextResponse.redirect(url, 307);

  url.pathname = "/shop";
  const res = NextResponse.redirect(url, 307);
  const opts = { path: "/", sameSite: "lax" as const, secure: req.nextUrl.protocol === "https:", maxAge: PREVIEW_DAYS * 86400 };
  res.cookies.set(PREVIEW_COOKIE, code, { ...opts, httpOnly: true });
  res.cookies.set(PREVIEW_FLAG_COOKIE, "1", opts);
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
