import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Cursor from "@/components/Cursor";
import { RegisterForm } from "@/components/AccountForms";
import { backendEnabled } from "@/lib/backend";
import { getAccountArea } from "@/lib/account";

export const metadata: Metadata = {
  title: "Crea un account · Mèmo",
  robots: { index: false },
};

export default async function RegisterPage() {
  if (!backendEnabled) redirect("/");
  if (await getAccountArea()) redirect("/account");
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero lines={["Entra", "in squadra."]} lead="Crea il tuo account: ti mandiamo un'email per confermarlo." />
        <section className="container ac-narrow">
          <div className="co-card ac-card">
            <h2>Crea un account</h2>
            <RegisterForm />
            <p className="ac-alt">
              Hai già un account? <a href="/account">Accedi</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
