import { forwardToBackend } from "@/lib/backend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subtotal = Number(searchParams.get("subtotalCents") ?? 0);
  const safe = Number.isFinite(subtotal) && subtotal >= 0 ? Math.round(subtotal) : 0;
  return forwardToBackend(`/shipping/quote/?subtotalCents=${safe}&country=IT`, req);
}
