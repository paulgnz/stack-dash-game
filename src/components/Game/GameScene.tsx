import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Vector3 } from "three";
import { Player, playerPositionRef } from "./Player";
import { Track } from "./Track";
import { useGameStore } from "../../stores/gameStore";
import { PostProcessing } from "../Effects/PostProcessing";
import { DashTrail } from "../Effects/DashTrail";
import { Environment } from "./Environment";
import { useScreenEffects } from "../../systems/screenEffects";

function CameraFollow() {
  const { camera } = useThree();
  const smoothPos = useRef(new Vector3(0, 5, 10));

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "playing") return;

    const target = playerPositionRef.current;
    const desired = new Vector3(
      target.x * 0.3,
      target.y + 5,
      target.z + 10,
    );

    smoothPos.current.lerp(desired, 1 - Math.exp(-4 * delta));
    camera.position.copy(smoothPos.current);
    camera.lookAt(target.x * 0.2, target.y + 0.5, target.z - 8);

    // Apply screen shake
    const shakeIntensity = useScreenEffects.getState().shakeIntensity;
    useScreenEffects.getState().update(delta);
    if (shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.5;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.3;
    }
  });

  return null;
}

export function GameScene() {
  return (
    <Suspense fallback={null}>
      <Environment />
      <PostProcessing />
      <Physics gravity={[0, -30, 0]}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 15, 5]} intensity={0.8} castShadow />
        <pointLight position={[0, 10, -20]} color="#ff00ff" intensity={2} distance={50} />
        <pointLight position={[0, 10, -60]} color="#00ffcc" intensity={2} distance={50} />
        <CameraFollow />
        <Player />
        <Track />
        <DashTrail />
      </Physics>
    </Suspense>
  );
}
