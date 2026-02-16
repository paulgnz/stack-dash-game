import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGameStore, LANE_WIDTH } from "../../stores/gameStore";
import { generateObstacles } from "../../systems/trackGenerator";
import type { Obstacle, ObstacleType } from "../../systems/trackGenerator";
import { playerPositionRef } from "./Player";
import { audio } from "../../systems/audioSystem";
import { useScreenEffects } from "../../systems/screenEffects";

// ── Road Segment ──

const SEGMENT_LENGTH = 40;
const ROAD_WIDTH = LANE_WIDTH * 3 + 2;

function RoadSegment({ index }: { index: number }) {
  const zCenter = -(index * SEGMENT_LENGTH + SEGMENT_LENGTH / 2);
  const dividerX = LANE_WIDTH * 0.5 + 0.5;
  const edgeX = LANE_WIDTH * 1.5 + 1;

  return (
    <group>
      {/* Road surface */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, zCenter]}>
        <mesh receiveShadow>
          <boxGeometry args={[ROAD_WIDTH, 0.5, SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#0d0d1a" />
        </mesh>
      </RigidBody>

      {/* Lane dividers */}
      {[-dividerX, dividerX].map((x) => (
        <mesh key={`divider-${x}`} position={[x, 0.01, zCenter]}>
          <boxGeometry args={[0.06, 0.02, SEGMENT_LENGTH]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      {/* Road edge walls */}
      {[-edgeX, edgeX].map((x) => (
        <mesh key={`edge-${x}`} position={[x, 0.3, zCenter]}>
          <boxGeometry args={[0.15, 0.6, SEGMENT_LENGTH]} />
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Obstacle Components ──

function BarrierObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group>
      {obstacle.lanes.map((lane) => (
        <mesh
          key={`barrier-${lane}`}
          position={[lane * LANE_WIDTH, 1, -obstacle.z]}
          castShadow
        >
          <boxGeometry args={[1.8, 2, 0.4]} />
          <meshStandardMaterial
            color="#ff2255"
            emissive="#ff2255"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function LowBarObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group>
      {obstacle.lanes.map((lane) => {
        const x = lane * LANE_WIDTH;
        return (
          <group key={`low-bar-${lane}`}>
            {/* Bar */}
            <mesh position={[x, 0.6, -obstacle.z]} castShadow>
              <boxGeometry args={[1.8, 0.3, 0.4]} />
              <meshStandardMaterial
                color="#ffaa00"
                emissive="#ffaa00"
                emissiveIntensity={0.5}
              />
            </mesh>
            {/* Left support post */}
            <mesh position={[x - 0.8, 0.3, -obstacle.z]}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial
                color="#ffaa00"
                emissive="#ffaa00"
                emissiveIntensity={0.3}
              />
            </mesh>
            {/* Right support post */}
            <mesh position={[x + 0.8, 0.3, -obstacle.z]}>
              <boxGeometry args={[0.08, 0.6, 0.08]} />
              <meshStandardMaterial
                color="#ffaa00"
                emissive="#ffaa00"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function OverheadObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group>
      {obstacle.lanes.map((lane) => (
        <mesh
          key={`overhead-${lane}`}
          position={[lane * LANE_WIDTH, 1.8, -obstacle.z]}
          castShadow
        >
          <boxGeometry args={[1.8, 1.2, 0.5]} />
          <meshStandardMaterial
            color="#aa00ff"
            emissive="#aa00ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

function GapObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <group>
      {obstacle.lanes.map((lane) => (
        <mesh
          key={`gap-${lane}`}
          position={[lane * LANE_WIDTH, -0.5, -obstacle.z]}
        >
          <boxGeometry args={[1.8, 0.6, 2]} />
          <meshStandardMaterial color="#020208" />
        </mesh>
      ))}
    </group>
  );
}

// ── Obstacle Type Router ──

function ObstacleRenderer({ obstacle }: { obstacle: Obstacle }) {
  const componentMap: Record<ObstacleType, React.FC<{ obstacle: Obstacle }>> = {
    barrier: BarrierObstacle,
    double_barrier: BarrierObstacle,
    moving_barrier: BarrierObstacle,
    low_bar: LowBarObstacle,
    overhead: OverheadObstacle,
    gap: GapObstacle,
  };

  const Component = componentMap[obstacle.type];
  return <Component obstacle={obstacle} />;
}

// ── Collision Detection Helpers ──

function canDodge(
  type: ObstacleType,
  isJumping: boolean,
  isSliding: boolean,
): boolean {
  if (type === "low_bar" && isJumping) return true;
  if (type === "low_bar" && isSliding) return true;
  if (type === "overhead" && isSliding) return true;
  if (type === "gap" && isJumping) return true;
  return false;
}

// ── Main Track Component ──

export function Track() {
  const seed = useGameStore((s) => s.seed);
  const phase = useGameStore((s) => s.phase);
  const renderDistance = 320;

  const obstacles = useMemo(() => {
    return generateObstacles(seed, 0, renderDistance);
  }, [seed]);

  const processedRef = useRef<Set<number>>(new Set());

  // Reset processed obstacles when a new game starts
  useEffect(() => {
    if (phase === "playing") {
      processedRef.current.clear();
    }
  }, [phase]);

  // Collision detection in useFrame
  useFrame(() => {
    if (phase !== "playing") return;

    const playerPos = playerPositionRef.current;
    const playerZ = -playerPos.z; // convert to positive for comparison
    const playerLane = Math.round(playerPos.x / LANE_WIDTH);

    const state = useGameStore.getState();

    for (const obs of obstacles) {
      if (processedRef.current.has(obs.z)) continue;

      // Player has fully passed the obstacle
      if (playerZ > obs.z + 2) {
        processedRef.current.add(obs.z);

        // Check near-miss for obstacles the player was never in a blocked lane for
        const inBlockedLane = obs.lanes.includes(playerLane);
        if (!inBlockedLane) {
          const isNearMiss = obs.lanes.some(
            (blockedLane) =>
              Math.abs(playerPos.x - blockedLane * LANE_WIDTH) <
              1.2 * LANE_WIDTH,
          );
          if (isNearMiss) {
            useGameStore.getState().addCombo();
            useGameStore.getState().addScore(50);
            audio.playNearMiss();
          }
        }
        continue;
      }

      // Player is at the obstacle
      if (Math.abs(playerZ - obs.z) < 0.8) {
        const inBlockedLane = obs.lanes.includes(playerLane);

        if (!inBlockedLane) {
          // Near-miss check: close to a blocked lane but not in it
          const isNearMiss = obs.lanes.some(
            (blockedLane) =>
              Math.abs(playerPos.x - blockedLane * LANE_WIDTH) <
              1.2 * LANE_WIDTH,
          );
          if (isNearMiss) {
            processedRef.current.add(obs.z);
            useGameStore.getState().addCombo();
            useGameStore.getState().addScore(50);
            audio.playNearMiss();
          }
        } else {
          // Player IS in a blocked lane
          if (canDodge(obs.type, state.isJumping, state.isSliding)) {
            // Dodged! Near-miss!
            processedRef.current.add(obs.z);
            useGameStore.getState().addCombo();
            useGameStore.getState().addScore(50);
            audio.playNearMiss();
          } else if (!state.isInvulnerable) {
            // HIT!
            processedRef.current.add(obs.z);
            useGameStore.getState().hit();
            audio.playCollapse();
            audio.vibrate([50, 30, 100]);
            useScreenEffects.getState().shake(0.8);
          }
        }
      }
    }
  });

  // Road segments
  const roadSegments = Array.from({ length: 8 }, (_, i) => i);

  return (
    <group>
      {/* Road */}
      {roadSegments.map((i) => (
        <RoadSegment key={`road-${i}`} index={i} />
      ))}

      {/* Obstacles */}
      {obstacles.map((obs) => (
        <ObstacleRenderer key={`obs-${obs.type}-${obs.z}`} obstacle={obs} />
      ))}
    </group>
  );
}
