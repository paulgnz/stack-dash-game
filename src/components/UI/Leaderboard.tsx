import { useState, useEffect } from "react";
import { getDailyLeaderboard, type LeaderboardEntry } from "../../systems/leaderboard";

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white", opacity: 0.5, fontSize: "14px", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ color: "white", opacity: 0.5, fontSize: "14px", textAlign: "center" }}>
        No scores yet today. Be the first!
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "300px",
        overflowY: "auto",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        color: "white",
      }}
    >
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: i < 3 ? "rgba(255,255,255,0.05)" : "transparent",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span
              style={{
                width: "24px",
                fontWeight: 700,
                color: i === 0 ? "#ffcc00" : i === 1 ? "#cccccc" : i === 2 ? "#cc8844" : "white",
              }}
            >
              {i + 1}
            </span>
            <span>{entry.name}</span>
          </div>
          <span style={{ fontWeight: 700 }}>{entry.score}</span>
        </div>
      ))}
    </div>
  );
}
