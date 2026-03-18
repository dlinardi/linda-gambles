import { useState, useEffect, useRef } from "react";

const STOCKS = [
  "AAPL", "TSLA", "NVDA", "GOOGL", "AMZN", "MSFT", "META", "NFLX",
  "AMD", "SHOP", "PLTR", "SOFI", "COIN", "RBLX", "SNAP", "UBER",
  "SQ", "ABNB", "CRWD", "DKNG", "RIVN", "LCID", "NIO", "MARA",
  "DIS", "BA", "JPM", "V", "KO", "MCD", "WMT", "COST"
];

const LINDA_FEARS = [
  "What if it crashes tomorrow?!",
  "My savings account is safe though...",
  "I saw a scary headline about this one...",
  "My coworker lost money on stocks once!",
  "But what about inflation eating my savings?",
  "The chart looks like a roller coaster!",
  "What would my mother think?!",
];

export default function LindaPortfolio() {
  const [phase, setPhase] = useState("intro"); // intro | loading | voting | results
  const [stock, setStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [votes, setVotes] = useState({ invest: 0, skip: 0 });
  const [lindaFear, setLindaFear] = useState("");
  const [history, setHistory] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [spinDisplay, setSpinDisplay] = useState("???");
  const spinRef = useRef(null);

  const pickRandomStock = () => {
    const available = STOCKS.filter(s => !history.map(h => h.stock).includes(s));
    const pool = available.length > 0 ? available : STOCKS;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const spinAndReveal = async () => {
    setSpinning(true);
    setPhase("loading");
    setAnalysis(null);
    setVotes({ invest: 0, skip: 0 });

    const chosen = pickRandomStock();
    setStock(chosen);
    setLindaFear(LINDA_FEARS[Math.floor(Math.random() * LINDA_FEARS.length)]);

    // Slot machine spin effect
    let i = 0;
    const totalSpins = 20;
    spinRef.current = setInterval(() => {
      setSpinDisplay(STOCKS[Math.floor(Math.random() * STOCKS.length)]);
      i++;
      if (i >= totalSpins) {
        clearInterval(spinRef.current);
        setSpinDisplay(chosen);
        setSpinning(false);
        fetchAnalysis(chosen);
      }
    }, 80 + i * 8);
  };

  const fetchAnalysis = async (ticker) => {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a stock analyst presenting to a nervous investor named Linda who is scared of the stock market. Return ONLY valid JSON, no markdown fences. Format:
{
  "company": "Full company name",
  "price": "Current/recent price as string",
  "change_pct": "Recent % change as string like +2.4% or -1.1%",
  "bull_case": "One punchy sentence on why to invest (speak to Linda directly, be encouraging)",
  "bear_case": "One punchy sentence on the risk (be honest but not terrifying)",
  "fun_fact": "One surprising/fun fact about this company that a crowd would find entertaining",
  "risk_level": "LOW or MEDIUM or HIGH",
  "sector": "e.g. Technology, Finance, etc."
}`,
          messages: [
            { role: "user", content: `Analyze the stock: ${ticker}. Give me current data and a quick take.` }
          ],
          tools: [{ type: "web_search_20250305", name: "web_search" }]
        })
      });
      const data = await res.json();
      const text = data.content
        ?.filter(b => b.type === "text")
        .map(b => b.text)
        .join("")
        .replace(/```json|```/g, "")
        .trim();
      if (text) {
        const parsed = JSON.parse(text);
        setAnalysis(parsed);
        setPhase("voting");
      } else {
        setAnalysis({ company: ticker, price: "N/A", change_pct: "N/A", bull_case: "Looks interesting!", bear_case: "Do your research.", fun_fact: "Every stock has a story.", risk_level: "MEDIUM", sector: "Unknown" });
        setPhase("voting");
      }
    } catch (e) {
      console.error(e);
      setAnalysis({ company: ticker, price: "N/A", change_pct: "N/A", bull_case: "The crowd knows best!", bear_case: "Trust the process.", fun_fact: "Investing is a team sport tonight!", risk_level: "MEDIUM", sector: "Unknown" });
      setPhase("voting");
    }
  };

  const castVote = (type) => {
    setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const finalize = () => {
    const decision = votes.invest > votes.skip ? "INVEST" : "SKIP";
    setHistory(prev => [...prev, { stock, decision, votes: { ...votes }, analysis }]);
    setPhase("results");
  };

  const totalVotes = votes.invest + votes.skip;
  const investPct = totalVotes > 0 ? Math.round((votes.invest / totalVotes) * 100) : 0;
  const skipPct = totalVotes > 0 ? 100 - investPct : 0;

  const riskColor = {
    LOW: "#4ade80",
    MEDIUM: "#fbbf24",
    HIGH: "#f87171"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a0f 0%, #0f1729 50%, #0a0a0f 100%)",
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      overflow: "hidden",
      position: "relative"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
      }} />

      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(56, 189, 248, 0.15)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #f472b6, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800
          }}>L</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", fontFamily: "Space Grotesk, sans-serif" }}>
              Linda's Portfolio Builder
            </div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2 }}>CROWD-POWERED INVESTING</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>STOCKS REVIEWED</div>
            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 20 }}>{history.length}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>PORTFOLIO</div>
            <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 20 }}>
              {history.filter(h => h.decision === "INVEST").length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* === INTRO PHASE === */}
        {phase === "intro" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{
              fontSize: 48, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
              background: "linear-gradient(90deg, #f472b6, #a78bfa, #38bdf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 16
            }}>
              Help Linda Invest!
            </div>
            <div style={{ fontSize: 18, color: "#94a3b8", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Linda is scared of the stock market. The crowd will decide her portfolio tonight.
            </div>

            {/* Linda's avatar */}
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto 32px",
              background: "linear-gradient(135deg, #f472b6 0%, #e879f9 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 60, boxShadow: "0 0 60px rgba(244,114,182,0.3)",
              animation: "pulse 2s ease-in-out infinite"
            }}>
              😰
            </div>
            <style>{`@keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }`}</style>

            <div style={{
              background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.2)",
              borderRadius: 12, padding: "12px 20px", display: "inline-block",
              fontSize: 14, color: "#f9a8d4", fontStyle: "italic", marginBottom: 40
            }}>
              "I've been keeping everything in a savings account earning 0.5%..."
            </div>

            <div>
              <button onClick={spinAndReveal} style={{
                padding: "18px 48px", fontSize: 20, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                boxShadow: "0 0 40px rgba(56,189,248,0.3)",
                transition: "all 0.2s",
                letterSpacing: 1
              }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
              >
                🎰 SPIN A STOCK
              </button>
            </div>
          </div>
        )}

        {/* === LOADING / SPIN PHASE === */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{
              fontSize: 80, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
              color: spinning ? "#64748b" : "#38bdf8",
              marginBottom: 24,
              transition: "color 0.3s",
              textShadow: spinning ? "none" : "0 0 40px rgba(56,189,248,0.5)"
            }}>
              ${spinDisplay}
            </div>

            {!spinning && !analysis && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#38bdf8",
                  animation: "blink 1s ease-in-out infinite"
                }} />
                <style>{`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }`}</style>
                <span style={{ color: "#64748b", fontSize: 14 }}>Analyzing with AI...</span>
              </div>
            )}
          </div>
        )}

        {/* === VOTING PHASE === */}
        {phase === "voting" && analysis && (
          <div>
            {/* Stock Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: 24, flexWrap: "wrap", gap: 16
            }}>
              <div>
                <div style={{
                  fontSize: 44, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
                  color: "#f8fafc"
                }}>${stock}</div>
                <div style={{ fontSize: 16, color: "#94a3b8" }}>{analysis.company}</div>
                <div style={{
                  display: "inline-block", marginTop: 8,
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  letterSpacing: 1,
                  background: `${riskColor[analysis.risk_level]}22`,
                  color: riskColor[analysis.risk_level],
                  border: `1px solid ${riskColor[analysis.risk_level]}44`
                }}>{analysis.risk_level} RISK · {analysis.sector?.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#f8fafc" }}>{analysis.price}</div>
                <div style={{
                  fontSize: 18, fontWeight: 600,
                  color: analysis.change_pct?.startsWith("-") ? "#f87171" : "#4ade80"
                }}>{analysis.change_pct}</div>
              </div>
            </div>

            {/* Analysis Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{
                background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 12, padding: 16
              }}>
                <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>📈 BULL CASE</div>
                <div style={{ fontSize: 14, color: "#d1fae5", lineHeight: 1.5 }}>{analysis.bull_case}</div>
              </div>
              <div style={{
                background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 12, padding: 16
              }}>
                <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>📉 BEAR CASE</div>
                <div style={{ fontSize: 14, color: "#fecaca", lineHeight: 1.5 }}>{analysis.bear_case}</div>
              </div>
            </div>

            {/* Fun fact */}
            <div style={{
              background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#c4b5fd"
            }}>
              💡 <strong>Fun fact:</strong> {analysis.fun_fact}
            </div>

            {/* Linda's fear */}
            <div style={{
              background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.2)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 12
            }}>
              <span style={{ fontSize: 28 }}>😰</span>
              <div>
                <div style={{ fontSize: 10, color: "#f472b6", letterSpacing: 2, fontWeight: 700 }}>LINDA SAYS</div>
                <div style={{ fontSize: 14, color: "#f9a8d4", fontStyle: "italic" }}>"{lindaFear}"</div>
              </div>
            </div>

            {/* Live Vote Bar */}
            {totalVotes > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                  <span>INVEST {investPct}%</span>
                  <span>{totalVotes} votes</span>
                  <span>SKIP {skipPct}%</span>
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: "#1e293b" }}>
                  <div style={{
                    width: `${investPct}%`, background: "linear-gradient(90deg, #4ade80, #22d3ee)",
                    transition: "width 0.4s ease", borderRadius: "99px 0 0 99px"
                  }} />
                  <div style={{
                    width: `${skipPct}%`, background: "linear-gradient(90deg, #fb923c, #f87171)",
                    transition: "width 0.4s ease", borderRadius: "0 99px 99px 0"
                  }} />
                </div>
              </div>
            )}

            {/* Vote Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <button onClick={() => castVote("invest")} style={{
                padding: "24px", fontSize: 22, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                background: "linear-gradient(135deg, #065f46, #047857)",
                color: "#4ade80", border: "2px solid #4ade8044",
                borderRadius: 16, cursor: "pointer",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = "#4ade80"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#4ade8044"; }}
              >
                <span style={{ fontSize: 36 }}>🚀</span>
                INVEST
                <span style={{ fontSize: 28, color: "#86efac" }}>{votes.invest}</span>
              </button>
              <button onClick={() => castVote("skip")} style={{
                padding: "24px", fontSize: 22, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                background: "linear-gradient(135deg, #7c2d12, #9a3412)",
                color: "#fb923c", border: "2px solid #fb923c44",
                borderRadius: 16, cursor: "pointer",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = "#fb923c"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "#fb923c44"; }}
              >
                <span style={{ fontSize: 36 }}>🛑</span>
                SKIP
                <span style={{ fontSize: 28, color: "#fdba74" }}>{votes.skip}</span>
              </button>
            </div>

            {/* Lock In Button */}
            {totalVotes > 0 && (
              <button onClick={finalize} style={{
                width: "100%", padding: "14px", fontSize: 16, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                letterSpacing: 1
              }}>
                🔒 LOCK IN THE CROWD'S DECISION ({totalVotes} votes)
              </button>
            )}
          </div>
        )}

        {/* === RESULTS PHASE === */}
        {phase === "results" && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            {(() => {
              const latest = history[history.length - 1];
              const isInvest = latest.decision === "INVEST";
              return (
                <>
                  <div style={{
                    fontSize: 72, marginBottom: 16,
                    animation: "pop 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)"
                  }}>
                    {isInvest ? "🎉" : "🙅‍♀️"}
                  </div>
                  <style>{`@keyframes pop { from { transform:scale(0) } to { transform:scale(1) } }`}</style>
                  <div style={{
                    fontSize: 36, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
                    color: isInvest ? "#4ade80" : "#fb923c", marginBottom: 8
                  }}>
                    {isInvest ? `LINDA INVESTS IN $${latest.stock}!` : `LINDA SKIPS $${latest.stock}`}
                  </div>
                  <div style={{ fontSize: 16, color: "#94a3b8", marginBottom: 32 }}>
                    {latest.votes.invest} for invest · {latest.votes.skip} for skip
                  </div>

                  {/* Portfolio Summary */}
                  {history.filter(h => h.decision === "INVEST").length > 0 && (
                    <div style={{
                      background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)",
                      borderRadius: 16, padding: 20, marginBottom: 32, textAlign: "left"
                    }}>
                      <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>
                        📊 LINDA'S PORTFOLIO
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {history.filter(h => h.decision === "INVEST").map((h, i) => (
                          <div key={i} style={{
                            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                            borderRadius: 8, padding: "8px 14px", fontSize: 14, fontWeight: 700, color: "#4ade80"
                          }}>
                            ${h.stock}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={spinAndReveal} style={{
                      padding: "16px 36px", fontSize: 18, fontWeight: 700,
                      fontFamily: "Space Grotesk, sans-serif",
                      background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                      color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                      letterSpacing: 1
                    }}>
                      🎰 NEXT STOCK
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
