"use client";

import { useEffect } from "react";
import { META_PIXEL_SNIPPET } from "@/lib/tracking";

// Il Pixel parte solo se nel banner di iubenda il visitatore ha accettato il marketing (finalità 5).
// La scelta si legge dal cookie di iubenda (_iub_cs-…): all'apertura della pagina e poi a ogni clic
// (il banner e il pannello delle preferenze salvano la scelta quando si clicca).
// Non si usa il sistema di iubenda che riattiva gli script marcati (_iub_cs_activate): sostituisce
// nodi che appartengono a React e la pagina va in errore (removeChild / insertBefore).
function marketingConsent(): boolean {
  const match = document.cookie.match(/(?:^|;\s*)_iub_cs-[^=]+=([^;]+)/);
  if (!match) return false;
  try {
    return JSON.parse(decodeURIComponent(match[1]))?.purposes?.["5"] === true;
  } catch {
    return false;
  }
}

export default function MetaPixel() {
  useEffect(() => {
    let loaded = false;
    const load = () => {
      if (loaded || !marketingConsent()) return;
      loaded = true;
      const s = document.createElement("script");
      s.text = META_PIXEL_SNIPPET;
      document.head.appendChild(s);
    };
    load();
    const onClick = () => window.setTimeout(load, 600);
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
