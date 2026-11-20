import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Cursor from "@/components/Cursor";
import { getOrder } from "@/lib/backend";
import { formatPrice } from "@/lib/catalog";
import ClearCart from "@/components/ClearCart";
import TrackPurchase from "@/components/TrackPurchase";
import { Arrow } from "@/components/ui";

// Pagina raggiungibile solo con il link segreto dell'ordine: mai nei motori di ricerca.
export const metadata: Metadata = {
  title: "Il tuo ordine · Mèmo",
  robots: { index: false },
  referrer: "no-referrer",
};

const SHIPMENT_LABELS: Record<string, string> = {
  ready: "In preparazione",
  shipped: "In viaggio",
  delivered: "Consegnato",
  problem: "Stiamo verificando la consegna",
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ pagamento?: string }> }) {
  const { token } = await params;
  const { pagamento } = await searchParams;
  const order = await getOrder(token);
  if (!order) notFound();

  // ordine appena concluso: pagato online, oppure da pagare alla consegna (contrassegno, 20/11/2026).
  // Solo allora si svuota il carrello e parte l'evento Acquisto (una volta per ordine).
  const confirmed = pagamento === "ok" && (order.paymentStatus === "paid" || (order.paymentMethod === "contrassegno" && order.status !== "cancelled"));
  const unpaid = order.paymentStatus === "pending" || order.paymentStatus === "partial";
  const awaiting = order.status === "awaiting";
  const cancelled = order.status === "cancelled";
  const hero: { lines: [string, string]; lead: string } = cancelled
    ? { lines: ["Ordine", "annullato."], lead: `L'ordine ${order.number} è stato annullato. Se avevi pagato con carta, il rimborso torna sullo stesso metodo di pagamento.` }
    : awaiting
      ? { lines: ["Manca solo", "il pagamento."], lead: `L'ordine ${order.number} non è ancora pagato: nessun addebito finché non completi il pagamento con carta.` }
      : { lines: ["Ordine", "ricevuto!"], lead: `Grazie! Il tuo ordine ${order.number} è confermato: trovi il riepilogo nella tua email. Ti scriviamo appena parte.` };

  return (
    <>
      <Cursor />
      <Header />
      <main className="page">
        {confirmed && (
          <>
            <ClearCart />
            <TrackPurchase
              order={{ number: order.number, totalCents: order.totalCents, shippingCents: order.shippingCents, taxCents: order.taxCents, items: order.items }}
            />
          </>
        )}
        <PageHero lines={hero.lines} lead={hero.lead} />
        <section className="container co-done">
          <div className="co-card">
            <h2>Ordine {order.number}</h2>
            <ul className="co-lines">
              {order.items.map((item) => (
                <li key={item.name}>
                  <span>
                    {item.qty} × Mèmo {item.name}
                  </span>
                  <strong>{formatPrice(item.totalCents)}</strong>
                </li>
              ))}
            </ul>
            <dl className="co-sum">
              <div>
                <dt>Subtotale</dt>
                <dd>{formatPrice(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div>
                  <dt>Sconto</dt>
                  <dd>−{formatPrice(order.discountCents)}</dd>
                </div>
              )}
              <div>
                <dt>Spedizione</dt>
                <dd>{formatPrice(order.shippingCents)}</dd>
              </div>
              <div className="co-sum-total">
                <dt>Totale</dt>
                <dd>{formatPrice(order.totalCents)}</dd>
              </div>
            </dl>
          </div>

          <div className="co-card">
            <h2>E adesso?</h2>
            {awaiting && (
              <div className="co-step">
                <strong>{pagamento === "annullato" ? "Pagamento non completato" : "Completa il pagamento"}</strong>
                <p>Il tuo ordine resta riservato per poco: se non paghi, si annulla da solo e non ti addebitiamo nulla.</p>
                {order.checkoutUrl && (
                  <a href={order.checkoutUrl} className="btn btn--blue">
                    Paga con carta <Arrow className="btn-arrow" />
                  </a>
                )}
              </div>
            )}
            {unpaid && order.paymentMethod === "bonifico" && (
              <div className="co-step">
                <strong>Completa il bonifico</strong>
                {order.bank ? (
                  <p>
                    Importo {formatPrice(order.totalCents)}, intestato a {order.bank.beneficiary}.
                    <br />
                    IBAN <span className="co-iban">{order.bank.iban}</span>
                    <br />
                    Causale: {order.number}
                  </p>
                ) : (
                  <p>Ti scriviamo a breve con i dati per il bonifico. Spediamo appena riceviamo il pagamento.</p>
                )}
              </div>
            )}
            {unpaid && order.paymentMethod === "contrassegno" && (
              <div className="co-step">
                <strong>Paghi alla consegna</strong>
                <p>Tieni pronti {formatPrice(order.totalCents)} in contanti per il corriere GLS.</p>
              </div>
            )}
            {awaiting || cancelled ? null : order.shipments.length > 0 ? (
              order.shipments.map((s, i) => (
                <div className="co-step" key={i}>
                  <strong>{SHIPMENT_LABELS[s.status] ?? "Spedizione"}</strong>
                  <p>
                    {s.carrier}{" "}
                    {s.trackingUrl ? (
                      <a href={s.trackingUrl} target="_blank" rel="noreferrer">
                        Segui il pacco
                      </a>
                    ) : (
                      s.tracking
                    )}
                  </p>
                </div>
              ))
            ) : (
              <div className="co-step">
                <strong>Prepariamo il pacco</strong>
                <p>Appena parte ricevi un&apos;email con il link per seguirlo.</p>
              </div>
            )}
            <p className="co-help">
              Dubbi sull&apos;ordine? Scrivici a <a href="mailto:info@memoitalia.it">info@memoitalia.it</a> indicando il numero {order.number}.
            </p>
            <a href="/shop" className="btn btn--blue">
              Torna allo shop
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
