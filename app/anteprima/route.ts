import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_FLAG_COOKIE, previewCode, setPreviewCookies } from "@/lib/shop";

// Link segreto per gli ordini di prova: /anteprima?codice=… apre lo shop in questo browser e porta allo shop.
// Dal 20/11/2026 il link da mandare è direttamente /shop?codice=… (lo gestisce proxy.ts); questo resta per i link vecchi.
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

  // porta allo shop col codice nell'indirizzo: lo shop si apre anche se il browser non salvasse qui i cookie
  url.pathname = "/shop";
  url.searchParams.set("codice", code);
  const res = NextResponse.redirect(url, 307);
  setPreviewCookies(res.cookies, code, req.nextUrl.protocol === "https:");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
