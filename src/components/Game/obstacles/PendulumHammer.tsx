import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import type { TrackSegment } from "../../../systems/trackGenerator";

export function PendulumHammer({ segment }: { segment: TrackSegment }) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;
    timeRef.current += delta;
    const x = Math.sin(timeRef.current * 2) * 2.5;
    bodyRef.current.setNextKinematicTranslation({
      x,
      y: 2,
      z: -segment.z - segment.length / 2,
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
      {/* Hammer */}
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders="cuboid" position={[0, 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.4} />
        </mesh>
      </RigidBody>
    </group>
  );
}
