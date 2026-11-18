import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/backend";

export async function GET() {
  return NextResponse.json({ products: await getCatalog() });
}
