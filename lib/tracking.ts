import { products } from "./catalog";

// Strumenti di misura di Mèmo. Gli ID sono pubblici: compaiono comunque nel codice delle pagine.
// Partono SOLO dopo il consenso nel banner di iubenda, e li carica components/Tracking.tsx:
// - Google Analytics 4 con la finalità 4 «Misurazione»;
// - Meta Pixel con la finalità 5 «Marketing».
// Niente <noscript> del Pixel: l'immagine partirebbe senza consenso.
export const GA4_ID = "G-NZTVZQBP88";
export const META_PIXEL_ID = "1812054646577555";

export const META_PIXEL_SNIPPET = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;

type TrackingWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

// Iscrizione nuova ad «Avvisami al lancio»: «Lead» per Meta, «generate_lead» per Google Analytics.
// Se il visitatore non ha dato il consenso lo strumento non c'è e non parte nulla.
export function trackLead(source: string) {
  const w = window as TrackingWindow;
  w.fbq?.("track", "Lead", { content_name: source });
  w.gtag?.("event", "generate_lead", { form_name: source });
}

// ---- Eventi della cassa (20/11/2026) ----
// Meta: AddToCart, InitiateCheckout, Purchase. Google Analytics: add_to_cart, begin_checkout, purchase.
// Importi in euro (non centesimi). Partono solo se lo strumento c'è, cioè col consenso.

// L'ordine riporta il nome del prodotto: lo si riporta al codice (golosa, integratore…) usato negli altri eventi.
const idOf = (name: string) => products.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())?.id ?? name;

export type TrackItem = { id: string; name: string; priceCents: number; qty: number };

const euros = (cents: number) => Math.round(cents) / 100;
const gaItems = (items: TrackItem[]) =>
  items.map((i) => ({ item_id: i.id, item_name: i.name, price: euros(i.priceCents), quantity: i.qty }));

// Gli strumenti si caricano dopo che la pagina è pronta (components/Tracking.tsx): un evento che parte
// all'apertura della pagina aspetta un attimo che ci siano, poi rinuncia (niente consenso = niente evento).
type Tools = Pick<TrackingWindow, "fbq" | "gtag">;
function whenReady(send: (t: Tools) => void) {
  let tries = 0;
  const sent = { fbq: false, gtag: false };
  const attempt = () => {
    const w = window as TrackingWindow;
    // ogni strumento riceve l'evento una volta sola, appena c'è
    const t: Tools = { fbq: sent.fbq ? undefined : w.fbq, gtag: sent.gtag ? undefined : w.gtag };
    if (t.fbq || t.gtag) send(t);
    if (t.fbq) sent.fbq = true;
    if (t.gtag) sent.gtag = true;
    if ((!sent.fbq || !sent.gtag) && ++tries < 12) window.setTimeout(attempt, 400);
  };
  attempt();
}

// Clic su «Aggiungi al carrello»: lo strumento è già caricato.
export function trackAddToCart(item: TrackItem) {
  const w = window as TrackingWindow;
  const value = euros(item.priceCents * item.qty);
  w.fbq?.("track", "AddToCart", {
    content_ids: [item.id], content_name: item.name, content_type: "product", contents: [{ id: item.id, quantity: item.qty }], value, currency: "EUR",
  });
  w.gtag?.("event", "add_to_cart", { currency: "EUR", value, items: gaItems([item]) });
}

// Apertura della cassa con il carrello pieno.
export function trackBeginCheckout(items: TrackItem[], subtotalCents: number) {
  const value = euros(subtotalCents);
  whenReady((w) => {
    w.fbq?.("track", "InitiateCheckout", {
      content_ids: items.map((i) => i.id), content_type: "product", contents: items.map((i) => ({ id: i.id, quantity: i.qty })),
      num_items: items.reduce((s, i) => s + i.qty, 0), value, currency: "EUR",
    });
    w.gtag?.("event", "begin_checkout", { currency: "EUR", value, items: gaItems(items) });
  });
}

// Ordine pagato (pagina dell'ordine al ritorno dal pagamento). Una volta sola per ordine, anche se si ricarica la pagina.
export function trackPurchase(order: { number: string; totalCents: number; shippingCents: number; taxCents: number; items: { name: string; qty: number; totalCents: number }[] }) {
  const key = `memo-acquisto-${order.number}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {}
  const value = euros(order.totalCents);
  whenReady((w) => {
    w.fbq?.(
      "track",
      "Purchase",
      {
        value, currency: "EUR", content_type: "product", order_id: order.number, content_ids: order.items.map((i) => idOf(i.name)),
        contents: order.items.map((i) => ({ id: idOf(i.name), quantity: i.qty })), num_items: order.items.reduce((s, i) => s + i.qty, 0),
      },
      { eventID: `acquisto-${order.number}` },
    );
    w.gtag?.("event", "purchase", {
      transaction_id: order.number, currency: "EUR", value, shipping: euros(order.shippingCents), tax: euros(order.taxCents),
      items: order.items.map((i) => ({ item_id: idOf(i.name), item_name: i.name, quantity: i.qty, price: euros(i.qty ? i.totalCents / i.qty : i.totalCents) })),
    });
  });
}
