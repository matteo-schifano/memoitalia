// Meta Pixel (account pubblicitario di Mèmo). L'ID è pubblico: compare comunque nel codice delle pagine.
// Il Pixel parte SOLO dopo il consenso «Marketing» nel banner di iubenda: lo script sta in layout.tsx
// con type="text/plain" e la classe _iub_cs_activate, e iubenda lo attiva quando il visitatore accetta
// (finalità 5 = marketing). Niente <noscript>: l'immagine partirebbe senza consenso.
export const META_PIXEL_ID = "1812054646577555";

export const META_PIXEL_SNIPPET = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;

type PixelWindow = Window & { fbq?: (...args: unknown[]) => void };

// Iscrizione nuova ad «Avvisami al lancio»: evento «Lead» per le campagne Meta.
// Se il visitatore non ha accettato i cookie di marketing il Pixel non c'è e non parte nulla.
export function trackLead(source: string) {
  (window as PixelWindow).fbq?.("track", "Lead", { content_name: source });
}
