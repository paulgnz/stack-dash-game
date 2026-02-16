import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGameStore } from "../../stores/gameStore";
import { generateTrackSegments } from "../../systems/trackGenerator";
import type { TrackSegment } from "../../systems/trackGenerator";
import { MovingWall } from "./obstacles/MovingWall";
import { WindZone } from "./obstacles/WindZone";
import { PendulumHammer } from "./obstacles/PendulumHammer";
import { CrumblingPlatform } from "./obstacles/CrumblingPlatform";

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

function GravityFlipSegment({ segment }: { segment: TrackSegment }) {
  return (
    <group position={[0, 0, -segment.z - segment.length / 2]}>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[segment.width, 1, segment.length]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </RigidBody>
      {/* Gravity flip visual indicator */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[segment.width, 4, segment.length]} />
        <meshStandardMaterial
          color="#9900ff"
          emissive="#9900ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
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
          case "moving_wall":
            return <MovingWall key={i} segment={seg} />;
          case "wind":
            return <WindZone key={i} segment={seg} />;
          case "hammer":
            return <PendulumHammer key={i} segment={seg} />;
          case "crumbling":
            return <CrumblingPlatform key={i} segment={seg} />;
          case "gravity_flip":
            return <GravityFlipSegment key={i} segment={seg} />;
          default:
            return <PlatformSegment key={i} segment={seg} />;
        }
      })}
    </group>
  );
}
