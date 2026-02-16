import { useGameStore, getMultiplier, MAX_HP } from "../../stores/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const hp = useGameStore((s) => s.hp);

  const multiplier = getMultiplier(combo);

  const comboColor =
    combo >= 20 ? "#ff00ff" : combo >= 10 ? "#ffaa00" : "#00ffcc";

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
          textShadow: "0 2px 10px rgba(255,255,255,0.5)",
        }}
      >
        {score}
      </div>

      {/* Combo counter */}
      {combo > 0 && (
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            textAlign: "center",
            color: comboColor,
            textShadow: `0 2px 8px ${comboColor}`,
          }}
        >
          {combo}x COMBO ({multiplier.toFixed(1)}x)
        </div>
      )}

      {/* HP Hearts */}
      <div
        style={{
          position: "absolute",
          right: 16,
          top: 16,
          display: "flex",
          gap: "6px",
          fontSize: "24px",
        }}
      >
        {Array.from({ length: MAX_HP }, (_, i) => {
          const isFull = i < hp;
          return (
            <span
              key={i}
              style={{
                opacity: isFull ? 1 : 0.2,
                filter: isFull
                  ? "drop-shadow(0 0 6px rgba(255,0,0,0.8))"
                  : "none",
                color: "#ff0000",
              }}
            >
              {"\u2665"}
            </span>
          );
        })}
      </div>
    </div>
  );
}
