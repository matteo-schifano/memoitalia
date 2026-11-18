import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Checkout from "@/components/Checkout";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Cursor from "@/components/Cursor";
import { backendEnabled } from "@/lib/backend";

export const metadata: Metadata = {
  title: "Cassa · Mèmo",
  robots: { index: false },
};

export default function CheckoutPage() {
  if (!backendEnabled) redirect("/shop");
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero lines={["Ci siamo", "quasi."]} lead="Ancora pochi dati e le tue barrette si mettono in viaggio." />
        <Checkout />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
