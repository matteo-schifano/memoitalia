"use client";

import { useEffect } from "react";
import { GA4_ID, META_PIXEL_SNIPPET } from "@/lib/tracking";

// Google Analytics 4 e Meta Pixel partono solo col consenso dato nel banner di iubenda:
// finalità 4 «Misurazione» per Analytics, 5 «Marketing» per il Pixel.
// La scelta si legge dal cookie di iubenda (_iub_cs-…): all'apertura della pagina e poi a ogni clic
// (il banner e il pannello delle preferenze salvano la scelta quando si clicca).
// Non si usa il sistema di iubenda che riattiva gli script marcati (_iub_cs_activate): sostituisce
// nodi che appartengono a React e la pagina va in errore (removeChild / insertBefore).
type Purposes = Record<string, boolean>;
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

function consent(): Purposes {
  const match = document.cookie.match(/(?:^|;\s*)_iub_cs-[^=]+=([^;]+)/);
  if (!match) return {};
  try {
    return JSON.parse(decodeURIComponent(match[1]))?.purposes ?? {};
  } catch {
    return {};
  }
}

function addScript(fill: (s: HTMLScriptElement) => void) {
  const s = document.createElement("script");
  fill(s);
  document.head.appendChild(s);
}

// Google Consent Mode v2: Analytics col consenso «Misurazione», segnali pubblicitari solo col «Marketing»
function googleConsent(p: Purposes) {
  const ads = p["5"] === true ? "granted" : "denied";
  return { analytics_storage: "granted", ad_storage: ads, ad_user_data: ads, ad_personalization: ads };
}

export default function Tracking() {
  useEffect(() => {
    let ga = false;
    let pixel = false;
    const apply = () => {
      const p = consent();
      const w = window as GtagWindow;
      if (p["4"] === true && !ga) {
        ga = true;
        w.dataLayer = w.dataLayer || [];
        w.gtag = function () {
          // gtag vuole proprio l'oggetto arguments, non un array
          // eslint-disable-next-line prefer-rest-params
          w.dataLayer!.push(arguments);
        };
        w.gtag("consent", "default", googleConsent(p));
        w.gtag("js", new Date());
        w.gtag("config", GA4_ID);
        addScript((s) => {
          s.async = true;
          s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
        });
      } else if (ga) {
        w.gtag?.("consent", "update", googleConsent(p));
      }
      if (p["5"] === true && !pixel) {
        pixel = true;
        addScript((s) => {
          s.text = META_PIXEL_SNIPPET;
        });
      }
    };
    apply();
    const onClick = () => window.setTimeout(apply, 600);
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
