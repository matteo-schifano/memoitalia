"use client";

import { useEffect, useState } from "react";
import { PREVIEW_FLAG_COOKIE, SHOP_OPEN } from "./shop";

// Shop visibile: aperto a tutti (SHOP_OPEN) o anteprima col link segreto (lib/shop.ts).
// L'anteprima si legge dopo il caricamento, così la pagina iniziale è la stessa per tutti.
export function useShopOpen() {
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(document.cookie.split("; ").includes(`${PREVIEW_FLAG_COOKIE}=1`));
  }, []);
  return SHOP_OPEN || preview;
}
