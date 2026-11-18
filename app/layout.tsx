import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Archivo } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import SmoothScroll from "@/components/SmoothScroll";
import { backendEnabled, getCatalog } from "@/lib/backend";
import Script from "next/script";
import { IUBENDA_BANNER_SRC } from "@/lib/legal";
import Tracking from "@/components/Tracking";

const bomega = localFont({
  src: "../public/fonts/Bomega.woff2",
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  axes: ["wdth"],
  display: "swap",
});

const DESCRIPTION =
  "Mèmo, la barretta buona per natura: pochi ingredienti, senza edulcoranti, senza glutine e senza lattosio. Golosa, Cocco, Arachide e Gianduia.";

export const metadata: Metadata = {
  // indirizzo pubblico: serve per gli URL assoluti dell'immagine di anteprima (app/opengraph-image.jpg)
  metadataBase: new URL("https://memoitalia.it"),
  title: "Mèmo · Il buono memorabile",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Mèmo",
    title: "Mèmo · Il buono memorabile",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  // verifica del dominio memoitalia.it in Meta Business Manager
  verification: { other: { "facebook-domain-verification": "q1ojsez1857qsle8g22rzdcdaso3pz" } },
};

export const viewport: Viewport = {
  themeColor: "#0b4ea2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getCatalog();
  return (
    <html lang="it" className={`${bomega.variable} ${archivo.variable}`}>
      <body>
        {/* banner dei cookie di iubenda. Si carica dopo React: caricato prima, modifica la pagina
            (attributi data-cmp-info) e React segnala un errore. Gli strumenti che tracciano
            (Analytics, Pixel) vanno accesi solo dopo il consenso, non bloccati da questo script. */}
        {/* Google Analytics e Meta Pixel: partono solo dopo il consenso nel banner (components/Tracking.tsx) */}
        <Tracking />
        <Script src={IUBENDA_BANNER_SRC} strategy="afterInteractive" />
        <CartProvider products={products} checkoutEnabled={backendEnabled}>
          <SmoothScroll />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
