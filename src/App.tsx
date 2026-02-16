import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { GameScene } from "./components/Game/GameScene";
import { HUD } from "./components/UI/HUD";
import { MainMenu } from "./components/UI/MainMenu";
import { DeathScreen } from "./components/UI/DeathScreen";
import { useGameStore } from "./stores/gameStore";
import { parseChallengeUrl } from "./systems/challengeSystem";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  // Check for challenge URL on mount
  useEffect(() => {
    const challenge = parseChallengeUrl(window.location.href);
    if (challenge) {
      useGameStore.getState().setSeed(challenge.seed);
    }
  }, []);

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onPointerDown={() => {
        if (useGameStore.getState().phase === "playing") {
          (window as unknown as Record<string, (() => void) | undefined>).__stackDashPlaceBlock?.();
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 8, 12], fov: 50 }}
        style={{ background: "#0a0a0f" }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <GameScene />
      </Canvas>

      {phase === "playing" && <HUD />}
      {phase === "menu" && <MainMenu />}
      {phase === "dead" && <DeathScreen />}
    </div>
  );
}
