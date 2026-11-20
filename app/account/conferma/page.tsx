import type { Metadata } from "next";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import { VerifyBox } from "@/components/AccountForms";

export const metadata: Metadata = {
  title: "Conferma email · Mèmo",
  robots: { index: false },
};

// Link dell'email di conferma: resta aperta anche a shop chiuso (proxy.ts), come la pagina dell'ordine.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero lines={["Ci siamo", "quasi."]} lead="Stiamo confermando la tua email." />
        <section className="container ac-narrow">
          <div className="co-card ac-card">
            <VerifyBox token={token} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
