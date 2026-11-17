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
