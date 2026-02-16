import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { shareScore, getChallengeUrl } from "../../systems/shareSystem";

export function DeathScreen() {
  const finalScore = useGameStore((s) => s.finalScore);
  const bestScore = useGameStore((s) => s.bestScore);
  const seed = useGameStore((s) => s.seed);
  const reset = useGameStore((s) => s.reset);
  const start = useGameStore((s) => s.start);
  const isNewBest = finalScore >= bestScore && finalScore > 0;
  const [challengeCopied, setChallengeCopied] = useState(false);

  const handleRetry = () => {
    reset();
    start();
  };

  const handleShare = () => {
    void shareScore(finalScore, seed);
  };

  const handleChallenge = () => {
    const url = getChallengeUrl(seed, finalScore);
    void navigator.clipboard.writeText(url).then(() => {
      setChallengeCopied(true);
      setTimeout(() => setChallengeCopied(false), 1500);
    }).catch(() => {
      // Clipboard not available
    });
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        color: "white",
        gap: "16px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(10px)",
      }}
    >
      {isNewBest && (
        <div style={{ fontSize: "20px", color: "#00ffcc", fontWeight: 700 }}>
          NEW BEST!
        </div>
      )}

      <div style={{ fontSize: "64px", fontWeight: 900 }}>{finalScore}</div>

      <div style={{ fontSize: "14px", opacity: 0.5 }}>Best: {bestScore}</div>

      <button
        onClick={handleRetry}
        style={{
          marginTop: "24px",
          padding: "20px 60px",
          fontSize: "24px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #00ffcc, #00cc99)",
          border: "none",
          borderRadius: "16px",
          cursor: "pointer",
          color: "#0a0a0f",
          boxShadow: "0 4px 30px rgba(0,255,204,0.4)",
        }}
      >
        AGAIN
      </button>

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          onClick={handleShare}
          style={{
            padding: "12px 24px",
            fontSize: "14px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "12px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Share
        </button>
        <button
          onClick={handleChallenge}
          style={{
            padding: "12px 24px",
            fontSize: "14px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "12px",
            color: "white",
            cursor: "pointer",
          }}
        >
          {challengeCopied ? "Copied!" : "Challenge"}
        </button>
      </div>
    </div>
  );
}
