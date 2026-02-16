import { useGameStore } from "../../stores/gameStore";

export function MainMenu() {
  const start = useGameStore((s) => s.start);
  const bestScore = useGameStore((s) => s.bestScore);

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
        gap: "24px",
      }}
    >
      <h1
        style={{
          fontSize: "56px",
          fontWeight: 900,
          letterSpacing: "-2px",
          background: "linear-gradient(135deg, #00ffcc, #ff6600)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        STACK DASH
      </h1>

      {bestScore > 0 && (
        <p style={{ fontSize: "16px", opacity: 0.5 }}>Best: {bestScore}</p>
      )}

      <button
        onClick={start}
        style={{
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
        PLAY
      </button>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          opacity: 0.4,
          fontSize: "14px",
        }}
      >
        <p>Tap to stack blocks under you</p>
        <p>Bridge gaps, dodge tunnels, go tall for points</p>
        <p>Higher stack = bigger multiplier, but more wobble!</p>
      </div>
    </div>
  );
}
