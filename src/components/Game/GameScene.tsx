import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody } from "@react-three/rapier";
import { Suspense } from "react";
import { Vector3 } from "three";
import { Player, playerPositionRef } from "./Player";
import { useGameStore } from "../../stores/gameStore";

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
  });

  return null;
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[0, -0.5, -200]} receiveShadow>
        <boxGeometry args={[4, 1, 500]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </RigidBody>
  );
}

export function GameScene() {
  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -20, 0]}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 15, 5]} intensity={1} castShadow />
        <CameraFollow />
        <Player />
        <Ground />
      </Physics>
    </Suspense>
  );
}
