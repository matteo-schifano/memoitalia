import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  return forwardToBackend("/discounts/check/", req, body);
}
