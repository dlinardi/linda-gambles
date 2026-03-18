import { type NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a stock analyst presenting to a nervous investor named Linda who is scared of the stock market. Return ONLY valid JSON, no markdown fences. Format:
{
  "company": "Full company name",
  "price": "Current/recent price as string",
  "change_pct": "Recent % change as string like +2.4% or -1.1%",
  "bull_case": "One punchy sentence on why to invest (speak to Linda directly, be encouraging)",
  "bear_case": "One punchy sentence on the risk (be honest but not terrifying)",
  "fun_fact": "One surprising/fun fact about this company that a crowd would find entertaining",
  "risk_level": "LOW or MEDIUM or HIGH",
  "sector": "e.g. Technology, Finance, etc."
}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 },
    );
  }

  const { ticker } = (await req.json()) as { ticker: string };
  if (!ticker || typeof ticker !== "string") {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze the stock: ${ticker}. Give me current data and a quick take.`,
        },
      ],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: "Anthropic API error", detail: body },
      { status: res.status },
    );
  }

  const data = await res.json();
  const text = data.content
    ?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  if (!text) {
    return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw: text },
      { status: 502 },
    );
  }
}
