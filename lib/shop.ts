// Interruttore dello shop. Spento (come online dal 12/11/2026): niente Shop nel menu, niente carrello,
// niente link allo shop, e le pagine /shop, /checkout e /ordine rimandano alla home.
// Per riaprirlo: variabile NEXT_PUBLIC_SHOP_OPEN=1 (su Vercel o in .env.local) e nuova pubblicazione.
export const SHOP_OPEN = process.env.NEXT_PUBLIC_SHOP_OPEN === "1";

// Anteprima con link segreto (18/11/2026, ordini di prova degli amici di Ema prima del lancio):
// chi apre /anteprima?codice=<SHOP_PREVIEW_CODE> vede shop, carrello e cassa solo nel suo browser.
// Il codice sta nella variabile SHOP_PREVIEW_CODE (solo server: non finisce nel browser).
// Senza variabile l'anteprima è spenta. Per chiuderla a tutti basta cambiare o togliere la variabile.
export const PREVIEW_COOKIE = "memo-anteprima"; // contiene il codice, illeggibile dal browser: lo controlla proxy.ts
export const PREVIEW_FLAG_COOKIE = "memo-shop"; // "1": serve solo a mostrare Shop e carrello nell'header
export const PREVIEW_DAYS = 60;
export const previewCode = () => process.env.SHOP_PREVIEW_CODE?.trim() ?? "";

// Cookie dell'anteprima, messi sia da /anteprima sia da proxy.ts quando il codice arriva nell'indirizzo
// (link diretto /shop?codice=…, 20/11/2026: non dipende da un rimando, che qualche browser saltava).
type CookieJar = { set: (name: string, value: string, options: Record<string, unknown>) => unknown };
export function setPreviewCookies(cookies: CookieJar, code: string, secure: boolean) {
  const opts = { path: "/", sameSite: "lax" as const, secure, maxAge: PREVIEW_DAYS * 86400 };
  cookies.set(PREVIEW_COOKIE, code, { ...opts, httpOnly: true });
  cookies.set(PREVIEW_FLAG_COOKIE, "1", opts);
}

// PROVVISORIO (20/11/2026): «pagamento di prova» per provare tutto il percorso d'acquisto senza carta.
// Si accende aprendo /prova-pagamento?codice=<CHECKOUT_PRIVATE_SECRET> (variabile solo server, uguale sul backend):
// da quel browser in cassa compare «Pagamento di prova». Gli amici col link dell'anteprima non lo vedono.
// Da togliere prima del lancio (basta togliere la variabile su Vercel e Railway).
export const TEST_PAYMENT_COOKIE = "memo-prova";
export const privateCheckoutSecret = () => process.env.CHECKOUT_PRIVATE_SECRET?.trim() ?? "";

// Cassa privata (20/11/2026), da usare solo sul server: cosa può usare questo browser in cassa.
// - test: «Pagamento di prova» (link /prova-pagamento);
// - cod: «Paga alla consegna» (contrassegno), per chi ha il link degli amici (o quello di prova).
// Il backend li accetta solo con il segreto CHECKOUT_PRIVATE_SECRET, che aggiunge app/api/orders.
type CookieReader = { get: (name: string) => { value: string } | undefined };
export function privateCheckout(cookies: CookieReader) {
  const secret = privateCheckoutSecret();
  const preview = previewCode();
  const test = Boolean(secret) && cookies.get(TEST_PAYMENT_COOKIE)?.value === secret;
  const friend = Boolean(preview) && cookies.get(PREVIEW_COOKIE)?.value === preview;
  // «Paga alla consegna» SPENTO il 20/11/2026 su richiesta dell'utente («togli subito il contrassegno»):
  // non compare in cassa e app/api/orders lo rifiuta. Per riaccenderlo: cod: Boolean(secret) && (friend || test)
  void friend;
  return { secret, test, cod: false };
}
