import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Cursor from "@/components/Cursor";
import { LoginForm, LogoutButton } from "@/components/AccountForms";
import { LevelCard, OrderField, Reorder } from "@/components/AccountExtras";
import { Arrow } from "@/components/ui";
import { backendEnabled } from "@/lib/backend";
import { getAccountArea, safeNext } from "@/lib/account";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Il tuo account · Mèmo",
  robots: { index: false },
};

const DATE = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });

// Colore dell'etichetta di stato: mai rosso, come nel pannello (annullato/rimborsato in grigio)
const TONE: Record<string, string> = {
  Consegnato: "ok",
  Spedito: "ok",
  "In preparazione": "info",
  "In attesa di pagamento": "info",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!backendEnabled) redirect("/");
  const { next } = await searchParams;
  const area = await getAccountArea();

  if (!area) {
    return (
      <>
        <Cursor />
        <Header />
        <main className="page">
          <PageHero lines={["La tua", "area Mèmo."]} lead="Accedi per vedere i tuoi ordini e trovare i dati già pronti in cassa." />
          <section className="container ac-grid">
            <div className="co-card ac-card">
              <h2>Accedi</h2>
              <LoginForm next={safeNext(next)} />
            </div>
            <div className="co-card ac-card ac-card--soft">
              <h2>Nuovo su Mèmo?</h2>
              <p>Con un account ritrovi tutti i tuoi ordini, segui le spedizioni e in cassa trovi indirizzo e dati di fatturazione già compilati.</p>
              <p>Non è obbligatorio: puoi sempre comprare anche senza.</p>
              <a className="btn btn--accent" href="/account/registrati" data-cursor="Crea">
                Crea un account <Arrow className="btn-arrow" />
              </a>
            </div>
          </section>
        </main>
        <Footer />
        <CartDrawer />
      </>
    );
  }

  const { account, orders, stats } = area;
  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        <PageHero lines={[`Ciao ${account.firstName || ""}`.trim(), "i tuoi ordini."]} lead="Qui trovi tutti gli ordini fatti con la tua email, anche quelli di prima della registrazione." />
        <section className="container ac-area">
          {stats && <LevelCard stats={stats} />}
          <h2 className="ac-section-title">I tuoi ordini</h2>
          {orders.length === 0 ? (
            <div className="co-card ac-empty">
              <img src="/img/brand/elefante-fame.webp" alt="" width={140} height={149} />
              <p>Non hai ancora ordini. Mèmo ha un po&apos; fame…</p>
              <a href="/shop" className="btn btn--blue">
                Vai allo shop <Arrow className="btn-arrow" />
              </a>
            </div>
          ) : (
            <ul className="ac-orders">
              {orders.map((o) => (
                <li key={o.number} className="co-card ac-order">
                  <div className="ac-order-top">
                    <div>
                      <strong>Ordine {o.number}</strong>
                      <small>{DATE.format(new Date(o.placedAt))}</small>
                    </div>
                    <span className={`ac-tag ac-tag--${TONE[o.label] ?? "muted"}`}>{o.label}</span>
                  </div>
                  <p className="ac-items">{o.items.map((i) => `${i.qty} × ${i.name}`).join(" · ")}</p>
                  {o.stage !== null && o.stage !== undefined && <OrderField stage={o.stage} />}
                  <div className="ac-order-bottom">
                    <strong>{formatPrice(o.totalCents)}</strong>
                    <div className="ac-actions">
                      <Reorder items={o.items} />
                      {o.trackingUrl && (
                        <a className="btn btn--accent btn--sm" href={o.trackingUrl} target="_blank" rel="noopener">
                          Segui il pacco
                        </a>
                      )}
                      <a className="btn btn--blue btn--sm" href={`/ordine/${o.token}`}>
                        Vedi l&apos;ordine
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="ac-head ac-head--bottom">
            <p>
              Hai fatto l&apos;accesso come <strong>{account.email}</strong>
            </p>
            <LogoutButton />
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
