import { Canvas } from "@react-three/fiber";
import { GameScene } from "./components/Game/GameScene";
import { useGameStore } from "./stores/gameStore";

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const start = useGameStore((s) => s.start);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 50 }}
        style={{ background: "#0a0a0f" }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <GameScene />
      </Canvas>

      {/* Temporary start button - will be replaced by MainMenu in Task 10 */}
      {phase === "menu" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={start}
            style={{
              padding: "20px 40px",
              fontSize: "24px",
              background: "#00ffcc",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            START
          </button>
        </div>
      )}

      {phase === "dead" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            gap: "20px",
          }}
        >
          <h1>GAME OVER</h1>
          <p>Score: {useGameStore.getState().finalScore}</p>
          <button
            onClick={() => {
              useGameStore.getState().reset();
            }}
            style={{
              padding: "16px 32px",
              fontSize: "20px",
              background: "#00ffcc",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
