import type { Metadata } from "next";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import Cursor from "@/components/Cursor";
import { ForgotForm, ResetForm } from "@/components/AccountForms";

export const metadata: Metadata = {
  title: "Password · Mèmo",
  robots: { index: false },
};

// Senza token: chiede l'email per mandare il link. Col token (dall'email): sceglie la nuova password.
// Col token resta aperta anche a shop chiuso (proxy.ts).
export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero
          lines={token ? ["Nuova", "password."] : ["Password", "dimenticata?"]}
          lead={token ? "Scegli la nuova password: poi entri subito nel tuo account." : "Nessun problema: scrivi la tua email e ti mandiamo un link per sceglierne una nuova."}
        />
        <section className="container ac-narrow">
          <div className="co-card ac-card">
            {token ? <ResetForm token={token} /> : <ForgotForm />}
            <p className="ac-alt">
              <a href="/account">Torna all&apos;accesso</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
