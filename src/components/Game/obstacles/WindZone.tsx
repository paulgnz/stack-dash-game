import { RigidBody } from "@react-three/rapier";
import type { TrackSegment } from "../../../systems/trackGenerator";

export function WindZone({ segment }: { segment: TrackSegment }) {
  return (
    <group position={[0, 0, -segment.z - segment.length / 2]}>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[segment.width, 1, segment.length]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </RigidBody>
      {/* Wind visual indicator */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[segment.width, 4, segment.length]} />
        <meshStandardMaterial
          color="#00aaff"
          emissive="#00aaff"
          emissiveIntensity={0.2}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}
