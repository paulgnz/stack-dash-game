import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { TrackSegment } from "../../../systems/trackGenerator";
import { playerPositionRef } from "../Player";

export function CrumblingPlatform({ segment }: { segment: TrackSegment }) {
  const [crumbling, setCrumbling] = useState(false);
  const timerRef = useRef<number | null>(null);

  useFrame(() => {
    if (crumbling || timerRef.current !== null) return;

    const playerZ = playerPositionRef.current.z;
    const segZ = -segment.z - segment.length / 2;

    // Start crumbling when player is close
    if (Math.abs(playerZ - segZ) < segment.length) {
      timerRef.current = 0;
      setTimeout(() => {
        setCrumbling(true);
      }, 800); // 0.8 second delay before crumbling
    }
  });

  return (
    <RigidBody
      type={crumbling ? "dynamic" : "fixed"}
      colliders="cuboid"
      position={[0, -0.5, -segment.z - segment.length / 2]}
      mass={10}
    >
      <mesh receiveShadow>
        <boxGeometry args={[segment.width, 1, segment.length]} />
        <meshStandardMaterial
          color={crumbling ? "#ff4444" : "#2a1a1e"}
          emissive={crumbling ? "#ff4444" : "#000000"}
          emissiveIntensity={crumbling ? 0.3 : 0}
        />
      </mesh>
    </RigidBody>
  );
}
