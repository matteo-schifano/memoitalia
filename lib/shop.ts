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
