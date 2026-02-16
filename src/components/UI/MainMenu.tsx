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
          background: "linear-gradient(135deg, #00ffcc, #ff00ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        NEON DASH
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
        <p>Tap left/right to switch lanes</p>
        <p>Tap center to jump, swipe down to slide</p>
        <p>Arrow keys / WASD + Space on desktop</p>
        <p>Chain near-misses for combo multipliers!</p>
      </div>
    </div>
  );
}
