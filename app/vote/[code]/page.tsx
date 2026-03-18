"use client";

import { useState, useEffect, use } from "react";

export default function VotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [stock, setStock] = useState<string | null>(null);
  const [phase, setPhase] = useState("waiting");
  const [votedStocks, setVotedStocks] = useState<Record<string, string>>({});
  const [votes, setVotes] = useState({ invest: 0, skip: 0 });

  const voted = stock ? votedStocks[stock] ?? null : null;

  useEffect(() => {
    const es = new EventSource(`/api/room/${code}/stream`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) return;
      setVotes(data.votes);
      setStock(data.stock);
      setPhase(data.phase);
    };
    return () => es.close();
  }, [code]);

  const castVote = async (type: "invest" | "skip") => {
    if (!stock || votedStocks[stock]) return;
    setVotedStocks((prev) => ({ ...prev, [stock]: type }));
    await fetch(`/api/room/${code}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  };

  const totalVotes = votes.invest + votes.skip;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a0f 0%, #0f1729 50%, #0a0a0f 100%)",
      color: "#e2e8f0",
      fontFamily: "'Space Grotesk', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{ fontSize: 14, color: "#64748b", letterSpacing: 2, marginBottom: 8 }}>
        LINDA&apos;S PORTFOLIO
      </div>

      {phase === "waiting" || !stock ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <div style={{ fontSize: 20, color: "#94a3b8" }}>Waiting for next stock...</div>
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 56, fontWeight: 800, color: "#f8fafc", marginBottom: 8,
          }}>${stock}</div>

          {totalVotes > 0 && (
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far
            </div>
          )}

          {voted ? (
            <div style={{
              padding: "32px 48px", borderRadius: 20, textAlign: "center",
              background: voted === "invest"
                ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)",
              border: `2px solid ${voted === "invest" ? "#4ade8066" : "#fb923c66"}`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                {voted === "invest" ? "🚀" : "🛑"}
              </div>
              <div style={{
                fontSize: 24, fontWeight: 700,
                color: voted === "invest" ? "#4ade80" : "#fb923c",
              }}>
                You voted {voted.toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>
                Waiting for results...
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 400 }}>
              <button type="button" onClick={() => castVote("invest")} style={{
                flex: 1, padding: "32px 16px", fontSize: 24, fontWeight: 700,
                background: "linear-gradient(135deg, #065f46, #047857)",
                color: "#4ade80", border: "2px solid #4ade8044",
                borderRadius: 20, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 48 }}>🚀</span>
                INVEST
              </button>
              <button type="button" onClick={() => castVote("skip")} style={{
                flex: 1, padding: "32px 16px", fontSize: 24, fontWeight: 700,
                background: "linear-gradient(135deg, #7c2d12, #9a3412)",
                color: "#fb923c", border: "2px solid #fb923c44",
                borderRadius: 20, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 48 }}>🛑</span>
                SKIP
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
