import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/backend";
import { privateCheckout } from "@/lib/shop";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  // cassa privata (20/11/2026): il segreto per il backend lo aggiunge solo il server, e solo ai browser col link giusto
  const access = privateCheckout(await cookies());
  const method = body.paymentMethod;
  const allowed = method === "prova" ? access.test : method === "contrassegno" ? access.cod : true;
  if (!allowed) return NextResponse.json({ error: "Metodo di pagamento non disponibile." }, { status: 422 });
  return forwardToBackend(
    "/orders/",
    req,
    body,
    "Non siamo riusciti a registrare l'ordine: riprova tra poco, nulla è stato addebitato.",
    method === "prova" || method === "contrassegno" ? { "X-Memo-Private": access.secret } : {},
  );
}
