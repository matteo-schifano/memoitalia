"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "./CartProvider";
import { Arrow } from "./ui";
import { PRIVACY_URL } from "@/lib/legal";
import { trackBeginCheckout } from "@/lib/tracking";

type Rate = { id: number; name: string; priceCents: number; estimatedDays: string };
type Discount = { code: string; discountCents: number; freeShipping: boolean };

// Unico metodo in cassa: Stripe (carta, Apple Pay, Google Pay, Satispay… scelti dalla dashboard di Stripe).
// Bonifico tolto il 16/11/2026, contrassegno il 6/11 (il backend li rifiuta).
const CARD = {
  id: "stripe",
  label: "Paga online",
  note: "Carta, Apple Pay, Google Pay o Satispay, sulla pagina sicura di Stripe.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const { lines, products, totalCents: subtotal, ready, clear } = useCart();
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [rateId, setRateId] = useState<number | null>(null);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [payment, setPayment] = useState(CARD.id);
  const payments = cardEnabled ? [CARD] : [];
  const [company, setCompany] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [codeError, setCodeError] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const discountCents = discount?.discountCents ?? 0;
  const net = subtotal - discountCents;
  const rate = rates?.find((r) => r.id === rateId) ?? null;
  const shipping = discount?.freeShipping ? 0 : (rate?.priceCents ?? 0);
  const total = net + shipping;

  async function checkCode(code: string, cents: number) {
    const res = await fetch("/api/discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotalCents: cents }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  // Inizio del checkout per Meta e Google Analytics: una volta per apertura della cassa, col carrello pieno.
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !ready || !lines.length) return;
    tracked.current = true;
    const items = lines.map((l) => {
      const p = products.find((x) => x.id === l.id);
      return { id: l.id, name: p?.name ?? l.id, priceCents: p?.priceCents ?? 0, qty: l.qty };
    });
    trackBeginCheckout(items, subtotal);
  }, [ready, lines, products, subtotal]);

  // Se il carrello cambia (dal pannello laterale) il codice va ricalcolato sul nuovo importo.
  useEffect(() => {
    if (!discount || !subtotal) return;
    let live = true;
    checkCode(discount.code, subtotal)
      .then(({ ok, data }) => {
        if (!live) return;
        if (ok) {
          if (data.discountCents !== discount.discountCents) setDiscount(data);
        } else {
          setDiscount(null);
          setCodeError(data.error ?? "Il codice non è più valido.");
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [subtotal, discount]);

  // Il costo di spedizione può dipendere dalla spesa (soglia di gratuità).
  useEffect(() => {
    if (!net) return;
    let live = true;
    fetch(`/api/shipping?subtotalCents=${net}`)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        const list: Rate[] = data.rates ?? [];
        setRates(list);
        // La carta è proposta per prima, ma solo la prima volta: non cambia una scelta già fatta
        if (data.cardEnabled && !cardEnabled) {
          setCardEnabled(true);
          setPayment(CARD.id);
        }
        setRateId((id) => (list.some((r) => r.id === id) ? id : (list[0]?.id ?? null)));
      })
      .catch(() => live && setRates([]));
    return () => {
      live = false;
    };
  }, [net, cardEnabled]);

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCodeError("");
    try {
      const { ok, data } = await checkCode(code, subtotal);
      if (ok) {
        setDiscount(data);
        setCodeInput("");
      } else {
        setCodeError(data.error ?? "Codice non valido.");
      }
    } catch {
      setCodeError("Connessione assente, riprova tra un attimo.");
    }
  }

  function validate(fd: FormData) {
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("firstName") || !v("lastName")) return "Scrivi nome e cognome.";
    if (!EMAIL_RE.test(v("email"))) return "Controlla l'email.";
    if (v("phone").replace(/\D/g, "").length < 8) return "Serve un telefono: lo usa il corriere per la consegna.";
    if (!v("line1")) return "Scrivi l'indirizzo.";
    if (!/^\d{5}$/.test(v("postcode"))) return "Il CAP deve avere 5 cifre.";
    if (!v("city")) return "Scrivi la città.";
    if (!/^[A-Za-z]{2}$/.test(v("province"))) return "La provincia va scritta con due lettere, es. RE.";
    // Fattura sempre per le aziende; per i privati solo se inseriscono il codice fiscale (16/11/2026)
    const tax = v("billTax").replace(/\s/g, "");
    if (company) {
      if (!v("billName")) return "Scrivi la ragione sociale per la fattura.";
      if (!/^(IT)?\d{11}$/i.test(v("billVat").replace(/\s/g, ""))) return "La partita IVA deve avere 11 cifre.";
      if (tax && !/^([A-Z0-9]{16}|\d{11})$/i.test(tax)) return "Il codice fiscale dell'azienda non sembra corretto.";
      if (v("billSdi") && !/^[A-Z0-9]{7}$/i.test(v("billSdi"))) return "Il codice SDI deve avere 7 caratteri.";
    } else if (tax && !/^[A-Z0-9]{16}$/i.test(tax)) {
      return "Il codice fiscale deve avere 16 caratteri (oppure lascialo vuoto se non ti serve la fattura).";
    }
    if (!sameAddress) {
      if (!v("billLine1")) return "Scrivi l'indirizzo di fatturazione.";
      if (!/^\d{5}$/.test(v("billPostcode"))) return "Il CAP di fatturazione deve avere 5 cifre.";
      if (!v("billCity")) return "Scrivi la città di fatturazione.";
      if (!/^[A-Za-z]{2}$/.test(v("billProvince"))) return "La provincia di fatturazione va scritta con due lettere, es. RE.";
    }
    if (!rateId) return "Spedizione non disponibile: riprova tra poco.";
    if (fd.get("privacy") !== "on") return "Serve l'accettazione dell'informativa privacy.";
    return "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    const problem = validate(fd);
    setError(problem);
    if (problem) return;
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const name = `${v("firstName")} ${v("lastName")}`;
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v("email"),
          firstName: v("firstName"),
          lastName: v("lastName"),
          phone: v("phone"),
          address: {
            name,
            line1: v("line1"),
            line2: v("line2"),
            postcode: v("postcode"),
            city: v("city"),
            province: v("province").toUpperCase(),
            country: "IT",
            phone: v("phone"),
          },
          billing: {
            name: company ? v("billName") : name,
            // indirizzo vuoto = uguale alla spedizione
            ...(sameAddress
              ? {}
              : {
                  address: v("billLine1"),
                  postcode: v("billPostcode"),
                  city: v("billCity"),
                  province: v("billProvince").toUpperCase(),
                }),
            vatNumber: company ? v("billVat") : "",
            taxCode: v("billTax"),
            sdiCode: company ? v("billSdi") : "",
            pec: company ? v("billPec") : "",
          },
          items: lines.map((l) => ({ id: l.id, qty: l.qty })),
          shippingRateId: rateId,
          discountCode: discount?.code ?? "",
          paymentMethod: payment,
          note: v("note"),
          privacy: true,
          marketing: fd.get("marketing") === "on",
          // Il server rifiuta l'ordine se il totale non è quello che il cliente sta vedendo
          expectedTotalCents: total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Qualcosa non ha funzionato, riprova.");
        setSending(false);
        return;
      }
      // Con la carta il carrello resta finché il pagamento non è riuscito
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      clear();
      window.location.href = `/ordine/${data.token}`;
    } catch {
      setError("Connessione assente, riprova tra un attimo: l'ordine non è stato registrato.");
      setSending(false);
    }
  }

  if (!ready) return <section className="container co-empty" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <section className="container co-empty">
        <img src="/img/brand/mascot.webp" alt="" width={160} height={172} />
        <p>Il carrello è vuoto. Mèmo ha un po&apos; fame…</p>
        <a href="/shop" className="btn btn--blue">
          Vai allo shop
        </a>
      </section>
    );
  }

  return (
    <section className="container co-grid">
      <form className="cf co-form" onSubmit={onSubmit} noValidate>
        <fieldset className="co-block">
          <legend>I tuoi dati</legend>
          <div className="cf-row">
            <label className="cf-field">
              <span>Nome</span>
              <input name="firstName" autoComplete="given-name" required />
            </label>
            <label className="cf-field">
              <span>Cognome</span>
              <input name="lastName" autoComplete="family-name" required />
            </label>
          </div>
          <div className="cf-row">
            <label className="cf-field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required placeholder="nome@email.it" />
            </label>
            <label className="cf-field">
              <span>Telefono</span>
              <input name="phone" type="tel" autoComplete="tel" required placeholder="+39 333 000000" />
            </label>
          </div>
        </fieldset>

        <fieldset className="co-block">
          <legend>Dove spediamo</legend>
          <label className="cf-field">
            <span>Indirizzo</span>
            <input name="line1" autoComplete="address-line1" required placeholder="Via e numero civico" />
          </label>
          <label className="cf-field">
            <span>Scala, interno, c/o (facoltativo)</span>
            <input name="line2" autoComplete="address-line2" />
          </label>
          <div className="co-row-3">
            <label className="cf-field">
              <span>CAP</span>
              <input name="postcode" inputMode="numeric" autoComplete="postal-code" maxLength={5} required />
            </label>
            <label className="cf-field">
              <span>Città</span>
              <input name="city" autoComplete="address-level2" required />
            </label>
            <label className="cf-field">
              <span>Provincia</span>
              <input name="province" autoComplete="address-level1" maxLength={2} required placeholder="RE" />
            </label>
          </div>
          <label className="cf-field">
            <span>Note per la consegna (facoltativo)</span>
            <textarea name="note" rows={2} maxLength={1000} />
          </label>
        </fieldset>

        {/* Dati di fatturazione (16/11/2026): indirizzo per tutti; fattura alle aziende e ai privati che danno il codice fiscale */}
        <fieldset className="co-block">
          <legend>Dati di fatturazione</legend>
          <div className="cf-row co-kind">
            <label className={`co-option ${!company ? "is-on" : ""}`}>
              <input type="radio" name="billKind" checked={!company} onChange={() => setCompany(false)} />
              <span>
                <strong>Privato</strong>
              </span>
            </label>
            <label className={`co-option ${company ? "is-on" : ""}`}>
              <input type="radio" name="billKind" checked={company} onChange={() => setCompany(true)} />
              <span>
                <strong>Azienda o partita IVA</strong>
              </span>
            </label>
          </div>
          {company ? (
            <>
              <label className="cf-field">
                <span>Ragione sociale</span>
                <input name="billName" autoComplete="organization" required />
              </label>
              <div className="cf-row">
                <label className="cf-field">
                  <span>Partita IVA</span>
                  <input name="billVat" inputMode="numeric" maxLength={13} required />
                </label>
                <label className="cf-field">
                  <span>Codice fiscale (se diverso)</span>
                  <input name="billTax" maxLength={16} />
                </label>
              </div>
              <div className="cf-row">
                <label className="cf-field">
                  <span>Codice SDI (facoltativo)</span>
                  <input name="billSdi" maxLength={7} />
                </label>
                <label className="cf-field">
                  <span>PEC (facoltativa)</span>
                  <input name="billPec" type="email" />
                </label>
              </div>
            </>
          ) : (
            <label className="cf-field">
              <span>Codice fiscale (facoltativo)</span>
              <input name="billTax" maxLength={16} autoCapitalize="characters" placeholder="Inseriscilo se vuoi la fattura" />
            </label>
          )}
          <label className="cf-check">
            <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
            <span>L&apos;indirizzo di fatturazione è uguale a quello di spedizione</span>
          </label>
          {!sameAddress && (
            <>
              <label className="cf-field">
                <span>Indirizzo di fatturazione</span>
                <input name="billLine1" autoComplete="billing address-line1" required placeholder="Via e numero civico" />
              </label>
              <div className="co-row-3">
                <label className="cf-field">
                  <span>CAP</span>
                  <input name="billPostcode" inputMode="numeric" autoComplete="billing postal-code" maxLength={5} required />
                </label>
                <label className="cf-field">
                  <span>Città</span>
                  <input name="billCity" autoComplete="billing address-level2" required />
                </label>
                <label className="cf-field">
                  <span>Provincia</span>
                  <input name="billProvince" autoComplete="billing address-level1" maxLength={2} required placeholder="RE" />
                </label>
              </div>
            </>
          )}
        </fieldset>

        <fieldset className="co-block">
          <legend>Spedizione</legend>
          {rates === null && <p className="co-muted">Un attimo…</p>}
          {rates?.length === 0 && <p className="cf-error">Spedizione non disponibile al momento: riprova tra poco.</p>}
          {rates?.map((r) => (
            <label className={`co-option ${r.id === rateId ? "is-on" : ""}`} key={r.id}>
              <input type="radio" name="rate" checked={r.id === rateId} onChange={() => setRateId(r.id)} />
              <span>
                <strong>{r.name}</strong>
                {r.estimatedDays && <small>{r.estimatedDays}</small>}
              </span>
              <b>{discount?.freeShipping || r.priceCents === 0 ? "Gratis" : formatPrice(r.priceCents)}</b>
            </label>
          ))}
        </fieldset>

        <fieldset className="co-block">
          <legend>Pagamento</legend>
          {rates !== null && payments.length === 0 && (
            <p className="co-muted">Il pagamento online non è disponibile in questo momento: riprova più tardi o scrivici a info@memoitalia.it.</p>
          )}
          {payments.map((p) => (
            <label className={`co-option ${p.id === payment ? "is-on" : ""}`} key={p.id}>
              <input type="radio" name="payment" checked={p.id === payment} onChange={() => setPayment(p.id)} />
              <span>
                <strong>{p.label}</strong>
                <small>{p.note}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="co-block co-consents">
          <label className="cf-check">
            <input type="checkbox" name="privacy" required />
            <span>
              Ho letto l&apos;<a href={PRIVACY_URL} target="_blank" rel="noopener">informativa privacy</a> e acconsento al trattamento dei dati per gestire l&apos;ordine.
            </span>
          </label>
          <label className="cf-check">
            <input type="checkbox" name="marketing" />
            <span>Voglio ricevere novità e offerte via email (facoltativo).</span>
          </label>
        </div>

        <button className="btn btn--blue btn--lg btn--full" disabled={sending || payments.length === 0} data-cursor="Ordina">
          {sending ? "Un attimo…" : `${payment === CARD.id ? "Vai al pagamento" : "Conferma l'ordine"} · ${formatPrice(total)}`} {!sending && <Arrow className="btn-arrow" />}
        </button>
        {error && (
          <p className="cf-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <aside className="co-card co-summary" aria-label="Riepilogo dell'ordine">
        <h2>Il tuo ordine</h2>
        <ul className="co-lines">
          {lines.map((l) => {
            const p = products.find((x) => x.id === l.id);
            if (!p) return null;
            return (
              <li key={l.id}>
                <span>
                  {l.qty} × Mèmo {p.name}
                  {p.packSize ? <small>Box da {p.packSize} barrette</small> : null}
                </span>
                <strong>{formatPrice(p.priceCents * l.qty)}</strong>
              </li>
            );
          })}
        </ul>
        <div className="co-code">
          {discount ? (
            <p className="co-code-on">
              <span>Codice {discount.code}</span>
              <button type="button" onClick={() => setDiscount(null)}>
                Togli
              </button>
            </p>
          ) : (
            <>
              <label htmlFor="co-code-input">Hai un codice sconto?</label>
              <div>
                <input
                  id="co-code-input"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCode();
                    }
                  }}
                />
                <button type="button" className="btn btn--sm btn--blue" onClick={applyCode}>
                  Applica
                </button>
              </div>
            </>
          )}
          {codeError && (
            <p className="cf-error" role="alert">
              {codeError}
            </p>
          )}
        </div>
        <dl className="co-sum">
          <div>
            <dt>Subtotale</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discountCents > 0 && (
            <div>
              <dt>Sconto</dt>
              <dd>−{formatPrice(discountCents)}</dd>
            </div>
          )}
          <div>
            <dt>Spedizione</dt>
            <dd>{rate ? (shipping ? formatPrice(shipping) : "Gratis") : "–"}</dd>
          </div>
          <div className="co-sum-total">
            <dt>Totale</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="co-muted">Prezzi IVA inclusa.</p>
      </aside>
    </section>
  );
}
