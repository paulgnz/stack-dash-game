import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";
import { useGameStore } from "../../stores/gameStore";
import { audio } from "../../systems/audioSystem";
import { useScreenEffects } from "../../systems/screenEffects";
import { useReplayStore } from "../../stores/replayStore";

// Shared ref for camera follow and other systems to read player position
export const playerPositionRef = { current: new Vector3() };

export function Player() {
  const rigidBody = useRef<RapierRigidBody>(null);
  const frameCount = useRef(0);
  const speed = useGameStore((s) => s.speed);
  const phase = useGameStore((s) => s.phase);
  const addDistance = useGameStore((s) => s.addDistance);
  const addScore = useGameStore((s) => s.addScore);
  const die = useGameStore((s) => s.die);

  useFrame((state, delta) => {
    if (phase !== "playing" || !rigidBody.current) return;

    const pos = rigidBody.current.translation();

    // Update shared position ref
    playerPositionRef.current.set(pos.x, pos.y, pos.z);

    // Auto-run forward (negative Z)
    rigidBody.current.setLinvel(
      { x: 0, y: rigidBody.current.linvel().y, z: -speed },
      true
    );

    addDistance(speed * delta);

    // Distance-based scoring
    addScore(Math.round(speed * delta * 10));

    // Record replay frames (every 2nd frame to save memory)
    frameCount.current++;
    if (frameCount.current % 2 === 0) {
      useReplayStore.getState().recordFrame({
        time: state.clock.getElapsedTime(),
        playerPos: [pos.x, pos.y, pos.z],
        blocks: [],
        score: useGameStore.getState().score,
      });
    }

    // Die if fallen below the track
    if (pos.y < -5) {
      // Audio feedback
      audio.playCollapse();
      audio.vibrate([50, 30, 100]);

      // Screen effects
      useScreenEffects.getState().shake(1);
      useScreenEffects.getState().slowMotion(0.5);

      // Capture replay highlight
      useReplayStore.getState().captureHighlight();

      die();
    }
  });

  return (
    <RigidBody
      ref={rigidBody}
      position={[0, 2, 0]}
      colliders="ball"
      mass={1}
      linearDamping={0}
      angularDamping={0.5}
      lockRotations
      name="player"
    >
      <mesh castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#00ffcc"
          emissive="#00ffcc"
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}
