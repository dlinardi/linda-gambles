import { type NextRequest, NextResponse } from "next/server";
import { setStock } from "@/lib/rooms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { stock } = (await req.json()) as { stock: string };
  if (!stock) return NextResponse.json({ error: "Missing stock" }, { status: 400 });
  setStock(code, stock);
  return NextResponse.json({ ok: true });
}
