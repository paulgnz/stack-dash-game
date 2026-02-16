import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Vector3 } from "three";
import { Player, playerPositionRef } from "./Player";
import { BlockStack } from "./BlockStack";
import { Track } from "./Track";
import { useGameStore } from "../../stores/gameStore";
import { PostProcessing } from "../Effects/PostProcessing";
import { Environment } from "./Environment";
import { useScreenEffects } from "../../systems/screenEffects";

function CameraFollow() {
  const { camera } = useThree();
  const smoothPos = useRef(new Vector3(0, 8, 12));

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "playing") return;

    const target = playerPositionRef.current;
    const desired = new Vector3(
      target.x * 0.3,
      target.y + 8,
      target.z + 12
    );

    smoothPos.current.lerp(desired, 1 - Math.exp(-3 * delta));
    camera.position.copy(smoothPos.current);
    camera.lookAt(target.x * 0.3, target.y + 1, target.z - 5);

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
      <Physics gravity={[0, -40, 0]}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 15, 5]} intensity={1} castShadow />
        <CameraFollow />
        <Player />
        <BlockStack />
        <Track />
      </Physics>
    </Suspense>
  );
}
