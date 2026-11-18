import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  return forwardToBackend("/orders/", req, body, "Non siamo riusciti a registrare l'ordine: riprova tra poco, nulla è stato addebitato.");
}
