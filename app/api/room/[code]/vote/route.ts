import { type NextRequest, NextResponse } from "next/server";
import { vote } from "@/lib/rooms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { type } = (await req.json()) as { type: "invest" | "skip" };
  if (type !== "invest" && type !== "skip") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }
  const result = vote(code, type);
  if (!result) return NextResponse.json({ error: "Room not found or not voting" }, { status: 404 });
  return NextResponse.json(result);
}
