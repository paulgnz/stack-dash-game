import { useGameStore, getMultiplier } from "../../stores/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const hp = useGameStore((s) => s.hp);

  const multiplier = getMultiplier(combo);

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

      {/* HP and Combo */}
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          fontSize: "14px",
          opacity: 0.8,
          textAlign: "right",
        }}
      >
        <div style={{ fontSize: "18px" }}>
          {"<3 ".repeat(hp)}
        </div>
        {combo > 0 && (
          <div style={{ color: "#00ffcc", marginTop: 4 }}>
            Combo: {combo}
          </div>
        )}
      </div>
    </div>
  );
}
