import { useState, useCallback, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useGameStore } from "../../stores/gameStore";
import { PHYSICS } from "../../systems/physicsConfig";
import { playerPositionRef } from "./Player";
import { audio } from "../../systems/audioSystem";
import { useBlockPlaceEffect, BlockParticles } from "../Effects/BlockPlaceEffect";
import { useCollapseEffect, CollapseParticles } from "../Effects/CollapseEffect";
import { useReplayStore } from "../../stores/replayStore";

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

  const {
    particles: blockParticles,
    setParticles: setBlockParticles,
    emit: emitBlockParticles,
  } = useBlockPlaceEffect();

  const {
    particles: collapseParticles,
    setParticles: setCollapseParticles,
    emit: _emitCollapseParticles,
  } = useCollapseEffect();

  // Reset blocks, particles, and replay store when game resets or starts
  useEffect(() => {
    if (phase === "menu" || phase === "playing") {
      setBlocks([]);
      blockBodiesRef.current.clear();
      blockIdCounter = 0;
      setBlockParticles([]);
      setCollapseParticles([]);
      if (phase === "menu") {
        useReplayStore.getState().reset();
      }
    }
  }, [phase, setBlockParticles, setCollapseParticles]);

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
    const speed = useGameStore.getState().speed;

    // Find the highest existing block near the player's Z position
    let stackY = 0; // ground level (top of track surface)
    blockBodiesRef.current.forEach((body) => {
      const bPos = body.translation();
      const dz = Math.abs(bPos.z - (playerPos.z - speed * 0.15));
      const dx = Math.abs(bPos.x - playerPos.x);
      if (dz < 1.5 && dx < 1.5) {
        const topY = bPos.y + PHYSICS.blockSize[1];
        if (topY > stackY) stackY = topY;
      }
    });

    // Place block slightly ahead of the player, stacked on existing blocks
    const position: [number, number, number] = [
      playerPos.x,
      stackY + PHYSICS.blockSize[1] / 2,
      playerPos.z - speed * 0.15, // slightly ahead
    ];
    const newBlock: Block = {
      id: ++blockIdCounter,
      position,
    };

    setBlocks((prev) => [...prev, newBlock]);
    placeBlock();
    cooldownRef.current = PHYSICS.placementCooldown;

    // Audio feedback
    audio.playBlockPlace(useGameStore.getState().stackHeight);
    audio.vibrate(20);

    // Particle effect
    emitBlockParticles(position);
  }, [phase, canPlaceBlock, placeBlock, emitBlockParticles]);

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
          type="fixed"
          colliders="cuboid"
          friction={PHYSICS.blockFriction}
          ref={(body: RapierRigidBody | null) => {
            if (body) {
              blockBodiesRef.current.set(block.id, body);
            }
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[1, PHYSICS.blockSize[1], 1.2]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff6600"
              emissiveIntensity={0.3}
            />
          </mesh>
        </RigidBody>
      ))}
      <BlockParticles
        particles={blockParticles}
        setParticles={setBlockParticles}
      />
      <CollapseParticles
        particles={collapseParticles}
        setParticles={setCollapseParticles}
      />
    </group>
  );
}
