import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Vector3, MathUtils, Group } from "three";
import { useGameStore, LANE_WIDTH } from "../../stores/gameStore";
import { PHYSICS } from "../../systems/physicsConfig";
import { mapKeyToAction, getTapZone } from "../../systems/inputSystem";
import type { GameAction } from "../../systems/inputSystem";

// Shared ref for camera follow and other systems to read player position
export const playerPositionRef = { current: new Vector3() };

export function Player() {
  const rigidBody = useRef<RapierRigidBody>(null);
  const groupRef = useRef<Group>(null);
  const frameCount = useRef(0);
  const jumpTimer = useRef(0);
  const slideTimer = useRef(0);
  const invulnTimer = useRef(0);
  const hasDeathTriggered = useRef(false);

  // Touch tracking refs
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const centerTapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchHandled = useRef(false);

  const phase = useGameStore((s) => s.phase);
  const speed = useGameStore((s) => s.speed);
  const lane = useGameStore((s) => s.lane);
  const isJumping = useGameStore((s) => s.isJumping);
  const isSliding = useGameStore((s) => s.isSliding);
  const isInvulnerable = useGameStore((s) => s.isInvulnerable);

  const addDistance = useGameStore((s) => s.addDistance);
  const addScore = useGameStore((s) => s.addScore);
  const switchLane = useGameStore((s) => s.switchLane);
  const setJumping = useGameStore((s) => s.setJumping);
  const setSliding = useGameStore((s) => s.setSliding);
  const setInvulnerable = useGameStore((s) => s.setInvulnerable);
  const hit = useGameStore((s) => s.hit);

  // Handle a game action
  const handleAction = useCallback(
    (action: GameAction) => {
      const state = useGameStore.getState();
      if (state.phase !== "playing") return;

      switch (action) {
        case "move_left":
          switchLane(-1);
          break;
        case "move_right":
          switchLane(1);
          break;
        case "jump":
          if (!state.isJumping && !state.isSliding) {
            setJumping(true);
            jumpTimer.current = PHYSICS.jumpDuration;
            // Apply upward velocity
            if (rigidBody.current) {
              const linvel = rigidBody.current.linvel();
              rigidBody.current.setLinvel(
                { x: linvel.x, y: PHYSICS.jumpForce, z: linvel.z },
                true,
              );
            }
          }
          break;
        case "slide":
          if (!state.isJumping && !state.isSliding) {
            setSliding(true);
            slideTimer.current = PHYSICS.slideDuration;
          }
          break;
      }
    },
    [switchLane, setJumping, setSliding],
  );

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = mapKeyToAction(e.key);
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAction]);

  // Touch input
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      const touch = e.touches[0];
      if (!touch) return;

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchHandled.current = false;

      const action = getTapZone(
        touch.clientX,
        touch.clientY,
        window.innerWidth,
        window.innerHeight,
      );

      if (action === "move_left" || action === "move_right") {
        handleAction(action);
        touchHandled.current = true;
      } else if (action === "jump") {
        // For center taps, wait 80ms to check for swipe before triggering jump
        centerTapTimeout.current = setTimeout(() => {
          if (!touchHandled.current) {
            handleAction("jump");
            touchHandled.current = true;
          }
        }, 80);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dy = touch.clientY - touchStartY.current;

      // Detect swipe down for slide
      if (dy > 40 && !touchHandled.current) {
        // Cancel pending center tap jump
        if (centerTapTimeout.current) {
          clearTimeout(centerTapTimeout.current);
          centerTapTimeout.current = null;
        }
        handleAction("slide");
        touchHandled.current = true;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (centerTapTimeout.current) {
        clearTimeout(centerTapTimeout.current);
      }
    };
  }, [handleAction]);

  // Reset player position when game starts
  useEffect(() => {
    if (phase === "playing" && rigidBody.current) {
      rigidBody.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      playerPositionRef.current.set(0, 1, 0);
      hasDeathTriggered.current = false;
      frameCount.current = 0;
      jumpTimer.current = 0;
      slideTimer.current = 0;
      invulnTimer.current = 0;
    }
  }, [phase]);

  useFrame((_state, delta) => {
    if (phase !== "playing" || !rigidBody.current) return;

    const pos = rigidBody.current.translation();
    const linvel = rigidBody.current.linvel();

    // --- Lane switching: smooth lerp to target X ---
    const targetX = lane * LANE_WIDTH;
    const currentX = pos.x;
    const newX = MathUtils.lerp(
      currentX,
      targetX,
      1 - Math.exp(-PHYSICS.laneSwitchSpeed * delta),
    );

    // --- Auto-run forward (negative Z) ---
    rigidBody.current.setLinvel(
      { x: (newX - currentX) / delta, y: linvel.y, z: -speed },
      true,
    );

    // --- Jump timer ---
    if (isJumping) {
      jumpTimer.current -= delta;
      if (jumpTimer.current <= 0 && pos.y < 1.5) {
        setJumping(false);
      }
    }

    // --- Slide timer ---
    if (isSliding) {
      slideTimer.current -= delta;
      if (slideTimer.current <= 0) {
        setSliding(false);
      }
    }

    // --- Invulnerability timer ---
    if (isInvulnerable) {
      invulnTimer.current -= delta;
      if (invulnTimer.current <= 0) {
        setInvulnerable(false);
      }
    }

    // --- Visual updates ---
    if (groupRef.current) {
      // Slide: scale Y to 0.4
      groupRef.current.scale.y = isSliding ? 0.4 : 1;

      // Invulnerability flash: toggle visibility every few frames
      if (isInvulnerable) {
        frameCount.current++;
        groupRef.current.visible = frameCount.current % 6 < 3;
      } else {
        groupRef.current.visible = true;
        frameCount.current = 0;
      }
    }

    // Update shared position ref
    playerPositionRef.current.set(pos.x, pos.y, pos.z);

    // --- Scoring ---
    addDistance(speed * delta);
    addScore(Math.round(speed * delta * 10));

    // --- Fall death ---
    if (pos.y < -3 && !hasDeathTriggered.current) {
      hasDeathTriggered.current = true;
      hit();
    }
  });

  // When the player gets hit (invulnerability starts), start the timer
  useEffect(() => {
    if (isInvulnerable) {
      invulnTimer.current = PHYSICS.invulnerabilityDuration;
    }
  }, [isInvulnerable]);

  return (
    <RigidBody
      ref={rigidBody}
      position={[0, 1, 0]}
      colliders={false}
      mass={3}
      linearDamping={0}
      angularDamping={1}
      lockRotations
      ccd
      enabledRotations={[false, false, false]}
      name="player"
    >
      <BallCollider args={[0.35]} position={[0, 0.35, 0]} />
      <group ref={groupRef}>
        {/* Capsule body */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Sphere head */}
        <mesh castShadow position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
