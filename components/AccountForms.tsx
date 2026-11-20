"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ui";
import { PRIVACY_URL } from "@/lib/legal";

// Moduli dell'area utente (20/11/2026): accesso, registrazione, password dimenticata, nuova password, conferma email.
// Il codice di accesso lo salva il server del sito in un cookie protetto: qui non passa mai.

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; message: string } | { kind: "error"; message: string };

async function post(action: string, body: unknown) {
  try {
    const res = await fetch(`/api/account/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Connessione assente, riprova tra un attimo." } };
  }
}

function PasswordField({ name, label, autoComplete, hint }: { name: string; label: string; autoComplete: string; hint?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="cf-field">
      <span>{label}</span>
      <span className="ac-pass">
        <input name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={8} maxLength={128} />
        <button type="button" className="ac-pass-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? "Nascondi la password" : "Mostra la password"}>
          {show ? "Nascondi" : "Mostra"}
        </button>
      </span>
      {hint && <small className="ac-hint">{hint}</small>}
    </label>
  );
}

function Feedback({ state }: { state: State }) {
  if (state.kind === "error")
    return (
      <p className="cf-error" role="alert">
        {state.message}
      </p>
    );
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    const { ok, data } = await post("login", { email: fd.get("email"), password: fd.get("password") });
    if (!ok) return setState({ kind: "error", message: data.error ?? "Qualcosa non ha funzionato, riprova." });
    window.location.href = next;
  }
  return (
    <form className="cf" onSubmit={onSubmit} noValidate>
      <label className="cf-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required placeholder="nome@email.it" />
      </label>
      <PasswordField name="password" label="Password" autoComplete="current-password" />
      <a className="ac-link" href="/account/password">
        Password dimenticata?
      </a>
      <button className="btn btn--blue btn--lg" disabled={state.kind === "sending"} data-cursor="Accedi">
        {state.kind === "sending" ? "Un attimo…" : "Accedi"} <Arrow className="btn-arrow" />
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function RegisterForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("firstName") || !v("lastName")) return setState({ kind: "error", message: "Scrivi nome e cognome." });
    if (String(fd.get("password") ?? "").length < 8) return setState({ kind: "error", message: "La password deve avere almeno 8 caratteri." });
    if (fd.get("privacy") !== "on") return setState({ kind: "error", message: "Serve l'accettazione dell'informativa privacy." });
    setState({ kind: "sending" });
    const { ok, data } = await post("register", {
      firstName: v("firstName"),
      lastName: v("lastName"),
      email: v("email"),
      password: fd.get("password"),
      privacy: true,
    });
    if (!ok) return setState({ kind: "error", message: data.error ?? "Qualcosa non ha funzionato, riprova." });
    setState({ kind: "done", message: data.message });
  }
  if (state.kind === "done") {
    return (
      <div className="cf-done" role="status">
        <strong>Controlla la tua email!</strong>
        <p>{state.message}</p>
      </div>
    );
  }
  return (
    <form className="cf" onSubmit={onSubmit} noValidate>
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
      <label className="cf-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required placeholder="nome@email.it" />
      </label>
      <PasswordField name="password" label="Password" autoComplete="new-password" hint="Almeno 8 caratteri, non solo numeri." />
      <label className="cf-check">
        <input type="checkbox" name="privacy" required />
        <span>
          Ho letto l&apos;<a href={PRIVACY_URL} target="_blank" rel="noopener">informativa privacy</a> e acconsento al trattamento dei dati per creare il mio account.
        </span>
      </label>
      <button className="btn btn--blue btn--lg" disabled={state.kind === "sending"} data-cursor="Crea">
        {state.kind === "sending" ? "Un attimo…" : "Crea il mio account"} <Arrow className="btn-arrow" />
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ForgotForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ kind: "sending" });
    const { ok, data } = await post("forgot", { email: String(fd.get("email") ?? "").trim() });
    if (!ok) return setState({ kind: "error", message: data.error ?? "Qualcosa non ha funzionato, riprova." });
    setState({ kind: "done", message: data.message });
  }
  if (state.kind === "done") {
    return (
      <div className="cf-done" role="status">
        <strong>Controlla la tua email!</strong>
        <p>{state.message} Il link vale 2 ore.</p>
      </div>
    );
  }
  return (
    <form className="cf" onSubmit={onSubmit} noValidate>
      <label className="cf-field">
        <span>Email del tuo account</span>
        <input name="email" type="email" autoComplete="email" required placeholder="nome@email.it" />
      </label>
      <button className="btn btn--blue btn--lg" disabled={state.kind === "sending"} data-cursor="Invia">
        {state.kind === "sending" ? "Un attimo…" : "Mandami il link"} <Arrow className="btn-arrow" />
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) return setState({ kind: "error", message: "La password deve avere almeno 8 caratteri." });
    if (password !== fd.get("password2")) return setState({ kind: "error", message: "Le due password non coincidono." });
    setState({ kind: "sending" });
    const { ok, data } = await post("reset", { token, password });
    if (!ok) return setState({ kind: "error", message: data.error ?? "Qualcosa non ha funzionato, riprova." });
    window.location.href = "/account";
  }
  return (
    <form className="cf" onSubmit={onSubmit} noValidate>
      <PasswordField name="password" label="Nuova password" autoComplete="new-password" hint="Almeno 8 caratteri, non solo numeri." />
      <PasswordField name="password2" label="Ripeti la nuova password" autoComplete="new-password" />
      <button className="btn btn--blue btn--lg" disabled={state.kind === "sending"} data-cursor="Salva">
        {state.kind === "sending" ? "Un attimo…" : "Salva e accedi"} <Arrow className="btn-arrow" />
      </button>
      <Feedback state={state} />
    </form>
  );
}

// Link della email di conferma: conferma, fa entrare e porta ai propri ordini.
export function VerifyBox({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "sending" });
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    post("verify", { token }).then(({ ok, data }) => {
      if (!ok) return setState({ kind: "error", message: data.error ?? "Il link non è valido o è scaduto." });
      if (data.alreadyVerified) return setState({ kind: "done", message: "La tua email era già confermata: accedi con la tua password." });
      window.location.href = "/account";
    });
  }, [token]);
  if (state.kind === "sending") return <p className="ac-wait">Un attimo, stiamo confermando la tua email…</p>;
  return (
    <div className={state.kind === "error" ? "ac-msg ac-msg--warn" : "cf-done"} role="status">
      <p>{state.kind === "error" || state.kind === "done" ? state.message : ""}</p>
      <a className="btn btn--blue" href="/account">
        Vai all&apos;accesso <Arrow className="btn-arrow" />
      </a>
    </div>
  );
}

export function LogoutButton() {
  const [sending, setSending] = useState(false);
  return (
    <button
      type="button"
      className="ac-logout"
      disabled={sending}
      onClick={async () => {
        setSending(true);
        await post("logout", {});
        window.location.href = "/account";
      }}
    >
      {sending ? "Un attimo…" : "Esci"}
    </button>
  );
}

// Pagina dell'ordine (20/11/2026): «scegli una password» per creare l'account con nome ed email dell'ordine.
export function OrderAccountOffer({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) return setState({ kind: "error", message: "La password deve avere almeno 8 caratteri." });
    setState({ kind: "sending" });
    const { ok, data } = await post("from-order", { token, password });
    if (!ok) return setState({ kind: "error", message: data.error ?? "Qualcosa non ha funzionato, riprova." });
    setState({ kind: "done", message: data.message });
  }
  return (
    <div className="ac-offer">
      <strong>Ritrova i tuoi ordini</strong>
      {state.kind === "done" ? (
        <p role="status">{state.message}</p>
      ) : (
        <>
          <p>Scegli una password: la prossima volta trovi i dati già scritti in cassa e segui i tuoi ordini dall&apos;area Mèmo.</p>
          <form className="cf" onSubmit={onSubmit} noValidate>
            <PasswordField name="password" label="Password" autoComplete="new-password" hint="Almeno 8 caratteri, non solo numeri." />
            <button className="btn btn--blue" disabled={state.kind === "sending"} data-cursor="Crea">
              {state.kind === "sending" ? "Un attimo…" : "Crea l'account"} <Arrow className="btn-arrow" />
            </button>
            <small className="ac-hint">
              Creando l&apos;account accetti l&apos;<a href={PRIVACY_URL} target="_blank" rel="noopener">informativa privacy</a>. Ti mandiamo un&apos;email per confermarlo.
            </small>
            <Feedback state={state} />
          </form>
        </>
      )}
    </div>
  );
}
