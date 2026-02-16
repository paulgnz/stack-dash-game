import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import type { TrackSegment } from "../../../systems/trackGenerator";

export function MovingWall({ segment }: { segment: TrackSegment }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const timeRef = useRef(0);
  const moveSpeed = segment.speed ?? 2;

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    timeRef.current += delta;
    const x = Math.sin(timeRef.current * moveSpeed) * 2;
    const pos = bodyRef.current.translation();
    bodyRef.current.setNextKinematicTranslation({
      x,
      y: pos.y,
      z: pos.z,
    });
  });

  return (
    <group position={[0, 0, -segment.z - segment.length / 2]}>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[segment.width, 1, segment.length]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </RigidBody>
      {/* Moving wall */}
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders="cuboid" position={[0, 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 4, 1]} />
          <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={0.4} />
        </mesh>
      </RigidBody>
    </group>
  );
}
