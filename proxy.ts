import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, SHOP_OPEN, previewCode, setPreviewCookies } from "./lib/shop";

// Cosa si vede sul dominio del cliente (memoitalia.it e www):
//   "tutto"        → tutto il sito (dal 12/11/2026), shop compreso solo se SHOP_OPEN (lib/shop.ts)
//   "home"         → solo la home; ogni altra pagina rimanda alla home
//   "costruzione"  → la pagina "Sito in costruzione" (app/in-costruzione, oggi solo in locale); ogni altra pagina rimanda lì
// Su memoitalia.vercel.app e in locale resta sempre tutto il sito.
// Per cambiare: modifica questa riga e pubblica.
const DOMAIN_MODE = "tutto" as "tutto" | "home" | "costruzione";

const DOMAIN_HOSTS = new Set(["memoitalia.it", "www.memoitalia.it"]);
// Pagine dello shop: con lo shop chiuso rimandano alla home, su ogni indirizzo
const SHOP_PATHS = /^\/(shop|checkout|ordine|account)(\/|$)/;
const ORDER_PATH = /^\/ordine\/[0-9a-f-]{36}$/i;
// link delle email dell'area utente (conferma e nuova password): aperti anche a shop chiuso, come l'ordine
const ACCOUNT_LINK = /^\/account\/(conferma|password)$/;

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;
  const toHome = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  };

  // con lo shop chiuso passa solo chi ha il link segreto dell'anteprima (lib/shop.ts, app/anteprima)
  const code = previewCode();
  // link per gli amici: /shop?codice=… (20/11/2026). Apre subito la pagina e salva l'anteprima nel browser,
  // senza passare da un rimando: alcuni amici che avevano già visitato il sito non vedevano lo shop
  const fromLink = Boolean(code) && request.nextUrl.searchParams.get("codice")?.trim() === code;
  if (fromLink && (!DOMAIN_HOSTS.has(host) || DOMAIN_MODE === "tutto")) {
    const res = NextResponse.next();
    setPreviewCookies(res.cookies, code, request.nextUrl.protocol === "https:");
    res.headers.set("X-Robots-Tag", "noindex");
    return res;
  }
  const preview = Boolean(code) && request.cookies.get(PREVIEW_COOKIE)?.value === code;
  // /ordine/<token> resta aperta a chi ha il link dell'ordine (email di conferma, anche da un altro telefono):
  // il token lungo e casuale basta a proteggerla, e senza backend la pagina non trova nulla
  // area utente (20/11/2026): a shop chiuso la vede chi ha il link degli amici o chi ha già fatto l'accesso
  // (gli account si creano solo da lì); per tutti gli altri apre il 15/12 insieme allo shop
  const hasAccount = Boolean(request.cookies.get("memo-account")?.value) && /^\/account(\/|$)/.test(pathname);
  const emailLink = ORDER_PATH.test(pathname) || (ACCOUNT_LINK.test(pathname) && request.nextUrl.searchParams.has("token")) || hasAccount;
  if (!SHOP_OPEN && !preview && SHOP_PATHS.test(pathname) && !emailLink) return toHome();
  if (!DOMAIN_HOSTS.has(host) || DOMAIN_MODE === "tutto") return NextResponse.next();

  if (DOMAIN_MODE === "costruzione") {
    // l'indirizzo resta memoitalia.it, ma si vede la pagina in costruzione
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/in-costruzione";
      return NextResponse.rewrite(url);
    }
    return toHome();
  }

  return pathname === "/" ? NextResponse.next() : toHome();
}

// Solo le pagine: file statici, immagini, font, icone e API (es. il modulo "Avvisami al lancio") passano senza controllo.
export const config = {
  matcher: ["/((?!_next/|api/|img/|fonts/|favicon\\.ico|icon\\.png|apple-icon\\.png|opengraph-image|twitter-image|robots\\.txt|sitemap\\.xml).*)"],
};
