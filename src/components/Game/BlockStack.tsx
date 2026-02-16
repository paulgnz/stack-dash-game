import { useState, useCallback, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useGameStore } from "../../stores/gameStore";
import { PHYSICS } from "../../systems/physicsConfig";
import { playerPositionRef } from "./Player";

interface Block {
  id: number;
  position: [number, number, number];
}

let blockIdCounter = 0;

export function BlockStack() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const blockBodiesRef = useRef<Map<number, RapierRigidBody>>(new Map());
  const cooldownRef = useRef(0);

  const phase = useGameStore((s) => s.phase);
  const canPlaceBlock = useGameStore((s) => s.canPlaceBlock);
  const placeBlock = useGameStore((s) => s.placeBlock);
  const resetBlockCooldown = useGameStore((s) => s.resetBlockCooldown);
  const setStackHeight = useGameStore((s) => s.setStackHeight);

  // Reset blocks when game resets
  useEffect(() => {
    if (phase === "menu") {
      setBlocks([]);
      blockBodiesRef.current.clear();
      blockIdCounter = 0;
    }
  }, [phase]);

  // Track cooldown and stack height
  useFrame((_, delta) => {
    if (phase !== "playing") return;

    // Cooldown management
    if (cooldownRef.current > 0) {
      cooldownRef.current -= delta;
      if (cooldownRef.current <= 0) {
        cooldownRef.current = 0;
        resetBlockCooldown();
      }
    }

    // Calculate stack height from block positions
    let maxY = 0;
    blockBodiesRef.current.forEach((body) => {
      const pos = body.translation();
      if (pos.y > maxY) maxY = pos.y;
    });
    setStackHeight(Math.max(0, Math.floor(maxY)));
  });

  const handlePlaceBlock = useCallback(() => {
    if (phase !== "playing" || !canPlaceBlock) return;

    const playerPos = playerPositionRef.current;
    const newBlock: Block = {
      id: ++blockIdCounter,
      position: [playerPos.x, playerPos.y + 2, playerPos.z],
    };

    setBlocks((prev) => [...prev, newBlock]);
    placeBlock();
    cooldownRef.current = PHYSICS.placementCooldown;
  }, [phase, canPlaceBlock, placeBlock]);

  // Expose the placement function globally for the tap handler
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__stackDashPlaceBlock =
      handlePlaceBlock;
    return () => {
      delete (
        window as unknown as Record<string, unknown>
      ).__stackDashPlaceBlock;
    };
  }, [handlePlaceBlock]);

  return (
    <group>
      {blocks.map((block) => (
        <RigidBody
          key={block.id}
          position={block.position}
          colliders="cuboid"
          mass={PHYSICS.blockMass}
          restitution={PHYSICS.blockRestitution}
          friction={PHYSICS.blockFriction}
          ref={(body: RapierRigidBody | null) => {
            if (body) {
              blockBodiesRef.current.set(block.id, body);
            }
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[...PHYSICS.blockSize]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff6600"
              emissiveIntensity={0.3}
            />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
