import { useGameStore } from "../../stores/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const stackHeight = useGameStore((s) => s.stackHeight);

  const multiplier = 1 + Math.floor(stackHeight / 5) * 0.5;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "16px",
        pointerEvents: "none",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        color: "white",
      }}
    >
      {/* Score */}
      <div
        style={{
          fontSize: "48px",
          fontWeight: 800,
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,255,204,0.5)",
        }}
      >
        {score}
      </div>

      {/* Multiplier */}
      {multiplier > 1 && (
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            textAlign: "center",
            color: "#ff6600",
            textShadow: "0 2px 8px rgba(255,102,0,0.5)",
          }}
        >
          x{multiplier.toFixed(1)}
        </div>
      )}

      {/* Stack height indicator */}
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 80,
          fontSize: "14px",
          opacity: 0.6,
        }}
      >
        {stackHeight}m
      </div>
    </div>
  );
}
