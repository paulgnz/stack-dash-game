import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "../../stores/gameStore";
import { generateTrackSegments } from "../../systems/trackGenerator";
import type { TrackSegment } from "../../systems/trackGenerator";

function PlatformSegment({ segment }: { segment: TrackSegment }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, -segment.z - segment.length / 2]}>
      <mesh receiveShadow>
        <boxGeometry args={[segment.width, 1, segment.length]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </RigidBody>
  );
}

function TunnelSegment({ segment }: { segment: TrackSegment }) {
  const tunnelHeight = segment.height ?? 3;
  return (
    <group position={[0, 0, -segment.z - segment.length / 2]}>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[segment.width, 1, segment.length]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </RigidBody>
      {/* Ceiling */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, tunnelHeight, 0]}>
        <mesh>
          <boxGeometry args={[segment.width + 1, 0.5, segment.length]} />
          <meshStandardMaterial
            color="#ff3366"
            emissive="#ff3366"
            emissiveIntensity={0.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}

function GapSegment() {
  // Gaps are just empty space - nothing to render
  return null;
}

export function Track() {
  const seed = useGameStore((s) => s.seed);
  const renderDistance = 200;

  const segments = useMemo(() => {
    return generateTrackSegments(seed, 0, renderDistance);
  }, [seed]);

  return (
    <group>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "platform":
            return <PlatformSegment key={i} segment={seg} />;
          case "gap":
            return <GapSegment key={i} />;
          case "tunnel":
            return <TunnelSegment key={i} segment={seg} />;
          // For now, render all other types as platforms
          // They'll get their own obstacle components in Task 9
          default:
            return <PlatformSegment key={i} segment={seg} />;
        }
      })}
    </group>
  );
}
