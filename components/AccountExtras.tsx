"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import type { AccountBadge, AccountStats } from "@/lib/account";
import type { ProductId } from "@/lib/catalog";

// Area utente (20/11/2026): traguardi sportivi, pacco «in campo», «Rifai la scorta».

// ---- traguardi ----
function BadgeIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "esordiente": // il numero 1
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path {...common} d="M13 11l4-3v16M12 24h9" />
        </svg>
      );
    case "assaggiatore": // quattro gusti
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <circle cx="11" cy="11" r="4" fill="currentColor" />
          <circle cx="21" cy="11" r="4" fill="currentColor" opacity=".8" />
          <circle cx="11" cy="21" r="4" fill="currentColor" opacity=".65" />
          <circle cx="21" cy="21" r="4" fill="currentColor" opacity=".5" />
        </svg>
      );
    case "titolare": // la maglia
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path {...common} d="M12 6l-6 4 3 5 3-2v13h8V13l3 2 3-5-6-4c-1 2-2.5 3-4 3s-3-1-4-3Z" />
        </svg>
      );
    case "capitano": // la fascia con la C
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <rect {...common} x="5" y="10" width="22" height="12" rx="3" />
          <path {...common} d="M19 13.5a3.5 3.5 0 1 0 0 5" />
        </svg>
      );
    default: // la bandiera
      return (
        <svg viewBox="0 0 32 32" aria-hidden>
          <path {...common} d="M9 27V5M9 6c5-3 9 3 15 0v11c-6 3-10-3-15 0" />
        </svg>
      );
  }
}

export function Badges({ badges }: { badges: AccountBadge[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section className="ac-badges" aria-label="I tuoi traguardi">
      <div className="ac-badges-head">
        <h2>I tuoi traguardi</h2>
        <span>
          {earned} su {badges.length}
        </span>
      </div>
      <ul>
        {badges.map((b) => (
          <li key={b.key} className={b.earned ? "is-earned" : ""}>
            <span className="ac-badge-medal">
              <BadgeIcon name={b.key} />
            </span>
            <strong>{b.name}</strong>
            <small>{b.text}</small>
            {!b.earned && b.progress && <em>{b.progress}</em>}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- pacco «in campo» ----
const STAGES = ["Ordinato", "In preparazione", "Partito", "Consegnato"];

export function OrderField({ stage }: { stage: number }) {
  const pos = (stage / (STAGES.length - 1)) * 100;
  return (
    <div className="ac-field" style={{ "--pos": `${pos}%` } as React.CSSProperties} role="img" aria-label={`Stato del pacco: ${STAGES[stage]}`}>
      <div className="ac-field-pitch">
        <span className="ac-field-done" />
        {STAGES.map((label, i) => (
          <span key={label} className={`ac-field-stop ${i <= stage ? "is-done" : ""}`} style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }} />
        ))}
        <img className="ac-field-mascot" src="/img/brand/mascot.webp" alt="" width={56} height={60} />
      </div>
      <ol className="ac-field-labels">
        {STAGES.map((label, i) => (
          <li key={label} className={i === stage ? "is-current" : i < stage ? "is-done" : ""}>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---- «Rifai la scorta» ----
export function Reorder({ items, light = false }: { items: { id: string; qty: number }[]; light?: boolean }) {
  const { add, setOpen, products } = useCart();
  const [missing, setMissing] = useState(false);
  return (
    <>
      <button
        type="button"
        className={light ? "btn ac-btn-white" : "btn btn--accent btn--sm"}
        data-cursor="Carrello"
        onClick={() => {
          const available = items.filter((i) => products.some((p) => p.id === i.id && p.inStock !== false));
          available.forEach((i) => add(i.id as ProductId, i.qty));
          setMissing(available.length < items.length);
          if (available.length) setOpen(true);
        }}
      >
        Rifai la scorta
      </button>
      {missing && <small className="ac-missing">Alcuni prodotti non sono disponibili in questo momento.</small>}
    </>
  );
}

// ---- livello in squadra (stile programma fedeltà, richiesto il 20/11/2026) ----
// Si sale di livello con le box acquistate. La barra ha le tacche alla stessa distanza, come nelle app fedeltà.
const LEVELS = [
  { name: "In panchina", min: 0 },
  { name: "Esordiente", min: 1 },
  { name: "Titolare", min: 3 },
  { name: "Capitano", min: 10 },
  { name: "Bandiera", min: 20 },
];
const TICKS = [0, 3, 10, 20];

function barPosition(boxes: number) {
  const last = TICKS[TICKS.length - 1];
  if (boxes >= last) return 100;
  const i = TICKS.findIndex((t, k) => boxes >= t && boxes < TICKS[k + 1]);
  const step = 100 / (TICKS.length - 1);
  return i * step + ((boxes - TICKS[i]) / (TICKS[i + 1] - TICKS[i])) * step;
}

export function LevelCard({ stats }: { stats: AccountStats }) {
  const current = [...LEVELS].reverse().find((l) => stats.boxes >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.min > stats.boxes);
  const pos = barPosition(stats.boxes);
  return (
    <section className="ac-level" aria-label="Il tuo livello in squadra">
      <div className="ac-level-head">
        <h2>Il mio livello in squadra</h2>
        <img src="/img/brand/mascot.webp" alt="" width={64} height={69} />
      </div>
      <div className="ac-level-body">
        <small>Il tuo livello</small>
        <strong className="ac-level-name">{current.name}</strong>
        <div className="ac-level-bar" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
          <span className="ac-level-fill" />
          <span className="ac-level-knob" />
        </div>
        <ol className="ac-level-ticks">
          {TICKS.map((t, i) => (
            <li key={t} style={{ left: `${(i / (TICKS.length - 1)) * 100}%` }}>
              {t}
            </li>
          ))}
        </ol>
        <div className="ac-level-numbers">
          <div>
            <small>Le tue box</small>
            <b>{stats.boxes}</b>
          </div>
          <div>
            <small>{next ? `Per diventare ${next.name}` : "Livello massimo"}</small>
            <b>{next ? next.min - stats.boxes : "🏆"}</b>
          </div>
        </div>
        <p className="ac-level-note">
          {stats.flavors >= 4 ? "Hai provato tutti e 4 i gusti: sei un vero Assaggiatore!" : `Hai provato ${stats.flavors} gusti su 4: ti manca ancora qualcosa da assaggiare.`}
        </p>
      </div>
    </section>
  );
}

export function PromoCard({ lastItems }: { lastItems: { id: string; qty: number }[] | null }) {
  return (
    <section className="ac-promo">
      <h2>Spedizione gratis da 40{"\u00a0"}€</h2>
      <p>{lastItems ? "Rifai la scorta della tua ultima box in un clic." : "Scegli le tue box: dai 40\u00a0€ la spedizione è gratis."}</p>
      {lastItems ? (
        <Reorder items={lastItems} light />
      ) : (
        <a className="btn ac-btn-white" href="/shop">
          Vai allo shop
        </a>
      )}
    </section>
  );
}
