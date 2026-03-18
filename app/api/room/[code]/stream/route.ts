import { type NextRequest } from "next/server";
import { subscribe, type RoomState } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = subscribe(code, (data: RoomState) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      });

      if (!cleanup) {
        controller.enqueue(encoder.encode(`data: {"error":"Room not found"}\n\n`));
        controller.close();
        return;
      }

      req.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
