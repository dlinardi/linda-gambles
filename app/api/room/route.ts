import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";

export async function POST() {
  const code = createRoom();
  return NextResponse.json({ code });
}
