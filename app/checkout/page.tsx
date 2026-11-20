import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Checkout from "@/components/Checkout";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Cursor from "@/components/Cursor";
import { cookies } from "next/headers";
import { backendEnabled } from "@/lib/backend";
import { privateCheckout } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Cassa · Mèmo",
  robots: { index: false },
};

export default async function CheckoutPage() {
  if (!backendEnabled) redirect("/shop");
  // cassa privata: «Pagamento di prova» col link /prova-pagamento, «Paga alla consegna» col link degli amici
  const access = privateCheckout(await cookies());
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero lines={["Ci siamo", "quasi."]} lead="Ancora pochi dati e le tue barrette si mettono in viaggio." />
        <Checkout testPayment={access.test} codPayment={access.cod} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
