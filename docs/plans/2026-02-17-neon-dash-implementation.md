# Neon Dash Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pivot Stack Dash from block-stacking to a 3-lane endless runner with combo chains and neon dash trails.

**Architecture:** Reuse existing R3F/Rapier/Zustand infrastructure. Replace Player (capsule + state machine), Track (3-lane road + obstacles), and controls (tap zones + keyboard). Add combo system for near-miss detection and dash trail visual effect. Remove all block-stacking code.

**Tech Stack:** React Three Fiber, @react-three/rapier, Zustand, Vite, TypeScript

---

### Task 1: Rework Game Store

**Files:**
- Modify: `src/stores/gameStore.ts`
- Modify: `src/stores/__tests__/gameStore.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/stores/__tests__/gameStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it("starts in menu phase", () => {
    expect(useGameStore.getState().phase).toBe("menu");
  });

  it("start sets phase to playing with 3 HP", () => {
    useGameStore.getState().start();
    const s = useGameStore.getState();
    expect(s.phase).toBe("playing");
    expect(s.hp).toBe(3);
    expect(s.combo).toBe(0);
    expect(s.lane).toBe(0);
    expect(s.score).toBe(0);
  });

  it("hit reduces HP and resets combo", () => {
    useGameStore.getState().start();
    useGameStore.getState().addCombo(); // combo = 1
    useGameStore.getState().hit();
    const s = useGameStore.getState();
    expect(s.hp).toBe(2);
    expect(s.combo).toBe(0);
  });

  it("hit at HP 1 triggers death", () => {
    useGameStore.getState().start();
    useGameStore.getState().hit();
    useGameStore.getState().hit();
    useGameStore.getState().hit();
    expect(useGameStore.getState().phase).toBe("dead");
  });

  it("addCombo increments combo counter", () => {
    useGameStore.getState().start();
    useGameStore.getState().addCombo();
    useGameStore.getState().addCombo();
    expect(useGameStore.getState().combo).toBe(2);
  });

  it("getMultiplier returns correct tier", () => {
    useGameStore.getState().start();
    expect(useGameStore.getState().getMultiplier()).toBe(1);
    for (let i = 0; i < 5; i++) useGameStore.getState().addCombo();
    expect(useGameStore.getState().getMultiplier()).toBe(1.5);
    for (let i = 0; i < 5; i++) useGameStore.getState().addCombo();
    expect(useGameStore.getState().getMultiplier()).toBe(2);
    for (let i = 0; i < 10; i++) useGameStore.getState().addCombo();
    expect(useGameStore.getState().getMultiplier()).toBe(3);
  });

  it("switchLane clamps to -1..1", () => {
    useGameStore.getState().start();
    useGameStore.getState().switchLane(-1);
    expect(useGameStore.getState().lane).toBe(-1);
    useGameStore.getState().switchLane(-1);
    expect(useGameStore.getState().lane).toBe(-1); // clamped
    useGameStore.getState().switchLane(1);
    useGameStore.getState().switchLane(1);
    useGameStore.getState().switchLane(1);
    expect(useGameStore.getState().lane).toBe(1); // clamped
  });

  it("addScore applies combo multiplier", () => {
    useGameStore.getState().start();
    for (let i = 0; i < 5; i++) useGameStore.getState().addCombo();
    useGameStore.getState().addScore(100);
    expect(useGameStore.getState().score).toBe(150); // 100 * 1.5
  });

  it("speed increases with distance", () => {
    useGameStore.getState().start();
    const baseSpeed = useGameStore.getState().speed;
    useGameStore.getState().addDistance(100);
    expect(useGameStore.getState().speed).toBeGreaterThan(baseSpeed);
  });

  it("die captures final score and best score", () => {
    useGameStore.getState().start();
    useGameStore.getState().addScore(500);
    useGameStore.getState().hit();
    useGameStore.getState().hit();
    useGameStore.getState().hit();
    const s = useGameStore.getState();
    expect(s.phase).toBe("dead");
    expect(s.finalScore).toBe(500);
    expect(s.bestScore).toBe(500);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/gameStore.test.ts`
Expected: Multiple failures (hp, combo, lane, hit, etc. don't exist yet)

**Step 3: Implement the reworked store**

```typescript
// src/stores/gameStore.ts
import { create } from "zustand";

export type GamePhase = "menu" | "playing" | "dead";

interface GameState {
  phase: GamePhase;
  score: number;
  finalScore: number;
  bestScore: number;
  speed: number;
  distance: number;
  seed: number;

  // Runner state
  hp: number;
  combo: number;
  lane: number; // -1 = left, 0 = center, 1 = right
  isJumping: boolean;
  isSliding: boolean;
  isInvulnerable: boolean;

  // Actions
  start: () => void;
  die: () => void;
  reset: () => void;
  addScore: (points: number) => void;
  addDistance: (delta: number) => void;
  addCombo: () => void;
  resetCombo: () => void;
  hit: () => void;
  switchLane: (direction: number) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  setInvulnerable: (v: boolean) => void;
  getMultiplier: () => number;
  setSeed: (seed: number) => void;
}

const BASE_SPEED = 8;
const SPEED_INCREMENT = 0.3;
const MAX_HP = 3;
const LANE_WIDTH = 2.5;

export { LANE_WIDTH, BASE_SPEED, MAX_HP };

function getMultiplier(combo: number): number {
  if (combo >= 50) return 5;
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "menu",
  score: 0,
  finalScore: 0,
  bestScore: 0,
  speed: BASE_SPEED,
  distance: 0,
  seed: Date.now(),

  hp: MAX_HP,
  combo: 0,
  lane: 0,
  isJumping: false,
  isSliding: false,
  isInvulnerable: false,

  start: () =>
    set({
      phase: "playing",
      score: 0,
      speed: BASE_SPEED,
      distance: 0,
      hp: MAX_HP,
      combo: 0,
      lane: 0,
      isJumping: false,
      isSliding: false,
      isInvulnerable: false,
      seed: Date.now(),
    }),

  die: () => {
    const { score, bestScore } = get();
    set({
      phase: "dead",
      finalScore: score,
      bestScore: Math.max(score, bestScore),
    });
  },

  reset: () =>
    set({
      phase: "menu",
      score: 0,
      finalScore: 0,
      speed: BASE_SPEED,
      distance: 0,
      hp: MAX_HP,
      combo: 0,
      lane: 0,
      isJumping: false,
      isSliding: false,
      isInvulnerable: false,
    }),

  addScore: (points: number) => {
    const multiplier = getMultiplier(get().combo);
    set((s) => ({ score: s.score + Math.round(points * multiplier) }));
  },

  addDistance: (delta: number) =>
    set((s) => {
      const newDistance = s.distance + delta;
      return {
        distance: newDistance,
        speed: BASE_SPEED + Math.floor(newDistance / 100) * SPEED_INCREMENT,
      };
    }),

  addCombo: () => set((s) => ({ combo: s.combo + 1 })),

  resetCombo: () => set({ combo: 0 }),

  hit: () => {
    const { hp } = get();
    if (hp <= 1) {
      get().die();
    } else {
      set({ hp: hp - 1, combo: 0, isInvulnerable: true });
    }
  },

  switchLane: (direction: number) =>
    set((s) => ({
      lane: Math.max(-1, Math.min(1, s.lane + direction)),
    })),

  setJumping: (v: boolean) => set({ isJumping: v }),
  setSliding: (v: boolean) => set({ isSliding: v }),
  setInvulnerable: (v: boolean) => set({ isInvulnerable: v }),

  getMultiplier: () => getMultiplier(get().combo),

  setSeed: (seed: number) => set({ seed }),
}));
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/gameStore.test.ts`
Expected: All 10 tests PASS

**Step 5: Commit**

```bash
git add src/stores/gameStore.ts src/stores/__tests__/gameStore.test.ts
git commit -m "feat: rework game store for endless runner (HP, combo, lanes)"
```

---

### Task 2: Input System

**Files:**
- Create: `src/systems/inputSystem.ts`
- Create: `src/systems/__tests__/inputSystem.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/systems/__tests__/inputSystem.test.ts
import { describe, it, expect } from "vitest";
import { getTapZone, mapKeyToAction } from "../inputSystem";
import type { GameAction } from "../inputSystem";

describe("inputSystem", () => {
  describe("getTapZone", () => {
    it("left third of screen returns move_left", () => {
      expect(getTapZone(100, 500, 900, 600)).toBe("move_left");
    });

    it("right third of screen returns move_right", () => {
      expect(getTapZone(700, 500, 900, 600)).toBe("move_right");
    });

    it("center of screen returns jump", () => {
      expect(getTapZone(450, 300, 900, 600)).toBe("jump");
    });
  });

  describe("mapKeyToAction", () => {
    it("ArrowLeft maps to move_left", () => {
      expect(mapKeyToAction("ArrowLeft")).toBe("move_left");
    });

    it("ArrowRight maps to move_right", () => {
      expect(mapKeyToAction("ArrowRight")).toBe("move_right");
    });

    it("Space maps to jump", () => {
      expect(mapKeyToAction(" ")).toBe("jump");
    });

    it("ArrowUp maps to jump", () => {
      expect(mapKeyToAction("ArrowUp")).toBe("jump");
    });

    it("ArrowDown maps to slide", () => {
      expect(mapKeyToAction("ArrowDown")).toBe("slide");
    });

    it("a maps to move_left", () => {
      expect(mapKeyToAction("a")).toBe("move_left");
    });

    it("d maps to move_right", () => {
      expect(mapKeyToAction("d")).toBe("move_right");
    });

    it("s maps to slide", () => {
      expect(mapKeyToAction("s")).toBe("slide");
    });

    it("unknown key returns null", () => {
      expect(mapKeyToAction("q")).toBeNull();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/systems/__tests__/inputSystem.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement the input system**

```typescript
// src/systems/inputSystem.ts
export type GameAction = "move_left" | "move_right" | "jump" | "slide";

/**
 * Determine action from tap position.
 * Left third = move_left, right third = move_right, center = jump.
 */
export function getTapZone(
  x: number,
  _y: number,
  screenWidth: number,
  _screenHeight: number
): GameAction {
  const third = screenWidth / 3;
  if (x < third) return "move_left";
  if (x > third * 2) return "move_right";
  return "jump";
}

const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: "move_left",
  ArrowRight: "move_right",
  ArrowUp: "jump",
  ArrowDown: "slide",
  " ": "jump",
  a: "move_left",
  d: "move_right",
  w: "jump",
  s: "slide",
};

export function mapKeyToAction(key: string): GameAction | null {
  return KEY_MAP[key] ?? null;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/systems/__tests__/inputSystem.test.ts`
Expected: All 9 tests PASS

**Step 5: Commit**

```bash
git add src/systems/inputSystem.ts src/systems/__tests__/inputSystem.test.ts
git commit -m "feat: add input system with tap zones and keyboard mapping"
```

---

### Task 3: Track Generator for 3-Lane Runner

**Files:**
- Modify: `src/systems/trackGenerator.ts`
- Modify: `src/systems/__tests__/trackGenerator.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/systems/__tests__/trackGenerator.test.ts
import { describe, it, expect } from "vitest";
import { generateObstacles } from "../trackGenerator";
import type { Obstacle } from "../trackGenerator";

describe("trackGenerator", () => {
  it("generates obstacles within the given range", () => {
    const obstacles = generateObstacles(12345, 0, 200);
    expect(obstacles.length).toBeGreaterThan(0);
    obstacles.forEach((o) => {
      expect(o.z).toBeGreaterThanOrEqual(0);
      expect(o.z).toBeLessThanOrEqual(200);
    });
  });

  it("deterministic: same seed produces same obstacles", () => {
    const a = generateObstacles(99, 0, 200);
    const b = generateObstacles(99, 0, 200);
    expect(a).toEqual(b);
  });

  it("different seeds produce different obstacles", () => {
    const a = generateObstacles(1, 0, 200);
    const b = generateObstacles(2, 0, 200);
    const aPositions = a.map((o) => o.z);
    const bPositions = b.map((o) => o.z);
    expect(aPositions).not.toEqual(bPositions);
  });

  it("only spawns unlocked obstacle types based on distance", () => {
    const early = generateObstacles(42, 0, 40);
    const earlyTypes = new Set(early.map((o) => o.type));
    expect(earlyTypes.has("moving_barrier")).toBe(false);
  });

  it("obstacles have valid lane values (-1, 0, or 1)", () => {
    const obstacles = generateObstacles(42, 0, 200);
    obstacles.forEach((o) => {
      o.lanes.forEach((lane) => {
        expect(lane).toBeGreaterThanOrEqual(-1);
        expect(lane).toBeLessThanOrEqual(1);
      });
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/systems/__tests__/trackGenerator.test.ts`
Expected: FAIL (generateObstacles, Obstacle don't exist)

**Step 3: Rewrite the track generator**

```typescript
// src/systems/trackGenerator.ts
import { SeededRandom } from "../utils/seededRandom";

export type ObstacleType =
  | "barrier"
  | "low_bar"
  | "gap"
  | "double_barrier"
  | "overhead"
  | "moving_barrier";

export interface Obstacle {
  type: ObstacleType;
  z: number;
  lanes: number[]; // which lanes are blocked (-1, 0, 1)
  speed?: number; // for moving barriers
}

const OBSTACLE_UNLOCK: Record<ObstacleType, number> = {
  barrier: 0,
  low_bar: 0,
  gap: 50,
  double_barrier: 100,
  overhead: 200,
  moving_barrier: 400,
};

const MIN_GAP_BETWEEN = 8; // minimum Z distance between obstacles

export function generateObstacles(
  seed: number,
  fromZ: number,
  toZ: number
): Obstacle[] {
  const rng = new SeededRandom(seed + Math.floor(fromZ));
  const obstacles: Obstacle[] = [];
  let z = fromZ + 15; // start a bit ahead

  while (z < toZ) {
    const available = (
      Object.entries(OBSTACLE_UNLOCK) as [ObstacleType, number][]
    )
      .filter(([, dist]) => z >= dist)
      .map(([type]) => type);

    const type = rng.pick(available);
    const obstacle = createObstacle(type, z, rng);
    obstacles.push(obstacle);

    z += MIN_GAP_BETWEEN + rng.range(0, 6);
  }

  return obstacles;
}

function createObstacle(
  type: ObstacleType,
  z: number,
  rng: SeededRandom
): Obstacle {
  switch (type) {
    case "barrier": {
      const lane = rng.int(-1, 1);
      return { type, z, lanes: [lane] };
    }
    case "low_bar": {
      const lane = rng.int(-1, 1);
      return { type, z, lanes: [lane] };
    }
    case "gap": {
      const lane = rng.int(-1, 1);
      return { type, z, lanes: [lane] };
    }
    case "double_barrier": {
      // Block 2 of 3 lanes
      const safe = rng.int(-1, 1);
      const blocked = [-1, 0, 1].filter((l) => l !== safe);
      return { type, z, lanes: blocked };
    }
    case "overhead": {
      const lane = rng.int(-1, 1);
      return { type, z, lanes: [lane] };
    }
    case "moving_barrier": {
      const lane = rng.int(-1, 1);
      return { type, z, lanes: [lane], speed: rng.range(1, 3) };
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/systems/__tests__/trackGenerator.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/systems/trackGenerator.ts src/systems/__tests__/trackGenerator.test.ts
git commit -m "feat: rewrite track generator for 3-lane obstacle spawning"
```

---

### Task 4: Player Component (Capsule + State Machine)

**Files:**
- Modify: `src/components/Game/Player.tsx`
- Modify: `src/systems/physicsConfig.ts`

**Step 1: Update physics config**

```typescript
// src/systems/physicsConfig.ts
export const PHYSICS = {
  laneWidth: 2.5,
  laneSwitchSpeed: 12,
  jumpForce: 15,
  jumpDuration: 0.5,
  slideDuration: 0.6,
  playerRadius: 0.3,
  playerHeight: 1.2,
  invulnerabilityDuration: 1.5,
};
```

**Step 2: Rewrite Player component**

```typescript
// src/components/Game/Player.tsx
import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";
import { useGameStore, LANE_WIDTH } from "../../stores/gameStore";
import { PHYSICS } from "../../systems/physicsConfig";
import { mapKeyToAction, getTapZone } from "../../systems/inputSystem";
import type { GameAction } from "../../systems/inputSystem";
import { audio } from "../../systems/audioSystem";
import { useScreenEffects } from "../../systems/screenEffects";

export const playerPositionRef = { current: new Vector3() };

export function Player() {
  const rigidBody = useRef<RapierRigidBody>(null);
  const phase = useGameStore((s) => s.phase);
  const speed = useGameStore((s) => s.speed);
  const addDistance = useGameStore((s) => s.addDistance);
  const addScore = useGameStore((s) => s.addScore);

  const targetLaneX = useRef(0);
  const jumpTimer = useRef(0);
  const slideTimer = useRef(0);
  const invulnTimer = useRef(0);
  const swipeStartY = useRef<number | null>(null);

  // Reset on game start
  useEffect(() => {
    if (phase === "playing" && rigidBody.current) {
      rigidBody.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      playerPositionRef.current.set(0, 1, 0);
      targetLaneX.current = 0;
      jumpTimer.current = 0;
      slideTimer.current = 0;
      invulnTimer.current = 0;
    }
  }, [phase]);

  const handleAction = useCallback(
    (action: GameAction) => {
      if (phase !== "playing") return;
      const store = useGameStore.getState();

      switch (action) {
        case "move_left":
          store.switchLane(-1);
          targetLaneX.current = store.lane * LANE_WIDTH;
          break;
        case "move_right":
          store.switchLane(1);
          targetLaneX.current = store.lane * LANE_WIDTH;
          break;
        case "jump":
          if (!store.isJumping) {
            store.setJumping(true);
            jumpTimer.current = PHYSICS.jumpDuration;
            if (rigidBody.current) {
              const vel = rigidBody.current.linvel();
              rigidBody.current.setLinvel(
                { x: vel.x, y: PHYSICS.jumpForce, z: vel.z },
                true
              );
            }
          }
          break;
        case "slide":
          if (!store.isSliding && !store.isJumping) {
            store.setSliding(true);
            slideTimer.current = PHYSICS.slideDuration;
          }
          break;
      }
    },
    [phase]
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
      swipeStartY.current = touch.clientY;
      // Process as tap zone immediately for lane switch / jump
      const action = getTapZone(
        touch.clientX,
        touch.clientY,
        window.innerWidth,
        window.innerHeight
      );
      if (action !== "jump") {
        handleAction(action);
      } else {
        // Wait to see if it's a swipe down
        setTimeout(() => {
          if (swipeStartY.current !== null) {
            handleAction("jump");
            swipeStartY.current = null;
          }
        }, 80);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (swipeStartY.current === null) return;
      const touch = e.changedTouches[0];
      const dy = touch.clientY - swipeStartY.current;
      if (dy > 40) {
        handleAction("slide");
      }
      swipeStartY.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleAction]);

  useFrame((_, delta) => {
    if (phase !== "playing" || !rigidBody.current) return;

    const pos = rigidBody.current.translation();
    playerPositionRef.current.set(pos.x, pos.y, pos.z);

    // Auto-run forward
    const vel = rigidBody.current.linvel();
    rigidBody.current.setLinvel({ x: vel.x, y: vel.y, z: -speed }, true);

    // Smooth lane switching
    const dx = targetLaneX.current - pos.x;
    rigidBody.current.setLinvel(
      {
        x: dx * PHYSICS.laneSwitchSpeed,
        y: vel.y,
        z: -speed,
      },
      true
    );

    // Jump timer
    if (jumpTimer.current > 0) {
      jumpTimer.current -= delta;
      if (jumpTimer.current <= 0 && pos.y < 1.5) {
        useGameStore.getState().setJumping(false);
      }
    }
    if (useGameStore.getState().isJumping && pos.y < 0.8 && jumpTimer.current <= 0) {
      useGameStore.getState().setJumping(false);
    }

    // Slide timer
    if (slideTimer.current > 0) {
      slideTimer.current -= delta;
      if (slideTimer.current <= 0) {
        useGameStore.getState().setSliding(false);
      }
    }

    // Invulnerability timer
    if (invulnTimer.current > 0) {
      invulnTimer.current -= delta;
      if (invulnTimer.current <= 0) {
        useGameStore.getState().setInvulnerable(false);
      }
    }
    if (
      useGameStore.getState().isInvulnerable &&
      invulnTimer.current <= 0
    ) {
      invulnTimer.current = PHYSICS.invulnerabilityDuration;
    }

    // Scoring
    addDistance(speed * delta);
    addScore(Math.round(speed * delta * 10));

    // Fall death
    if (pos.y < -3) {
      audio.playCollapse();
      useScreenEffects.getState().shake(1);
      useGameStore.getState().hit();
    }
  });

  const isSliding = useGameStore((s) => s.isSliding);
  const scaleY = isSliding ? 0.4 : 1;

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
      name="player"
      enabledRotations={[false, false, false]}
    >
      {/* Capsule-ish character: body + head */}
      <group scale={[1, scaleY, 1]}>
        {/* Body */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <capsuleGeometry args={[PHYSICS.playerRadius, PHYSICS.playerHeight * 0.5, 8, 16]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 1.15, 0]}>
          <sphereGeometry args={[PHYSICS.playerRadius * 0.8, 16, 16]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/Game/Player.tsx src/systems/physicsConfig.ts
git commit -m "feat: rewrite player as capsule character with jump/slide/lane-switch"
```

---

### Task 5: Track Renderer (3-Lane Road + Obstacles)

**Files:**
- Modify: `src/components/Game/Track.tsx`
- Delete: `src/components/Game/obstacles/MovingWall.tsx`
- Delete: `src/components/Game/obstacles/WindZone.tsx`
- Delete: `src/components/Game/obstacles/PendulumHammer.tsx`
- Delete: `src/components/Game/obstacles/CrumblingPlatform.tsx`

**Step 1: Delete old obstacle files**

```bash
rm -rf src/components/Game/obstacles/
```

**Step 2: Rewrite Track.tsx**

```typescript
// src/components/Game/Track.tsx
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGameStore, LANE_WIDTH } from "../../stores/gameStore";
import { generateObstacles } from "../../systems/trackGenerator";
import type { Obstacle } from "../../systems/trackGenerator";
import { playerPositionRef } from "./Player";
import { PHYSICS } from "../../systems/physicsConfig";
import { audio } from "../../systems/audioSystem";
import { useScreenEffects } from "../../systems/screenEffects";

const ROAD_SEGMENT_LENGTH = 40;
const ROAD_SEGMENTS = 8;
const NEAR_MISS_THRESHOLD = 1.2;

function RoadSegment({ z }: { z: number }) {
  return (
    <group position={[0, 0, -z]}>
      {/* Road surface */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.25, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[LANE_WIDTH * 3 + 2, 0.5, ROAD_SEGMENT_LENGTH]} />
          <meshStandardMaterial color="#0d0d1a" />
        </mesh>
      </RigidBody>
      {/* Lane lines */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * LANE_WIDTH * 0.5 + side * 0.5, 0.01, 0]}>
          <boxGeometry args={[0.05, 0.01, ROAD_SEGMENT_LENGTH]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.3}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
      {/* Road edges */}
      {[-1, 1].map((side) => (
        <mesh key={`edge-${side}`} position={[side * (LANE_WIDTH * 1.5 + 1), 0.3, 0]}>
          <boxGeometry args={[0.1, 0.6, ROAD_SEGMENT_LENGTH]} />
          <meshStandardMaterial
            color="#ff00ff"
            emissive="#ff00ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function BarrierObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <>
      {obstacle.lanes.map((lane) => (
        <group key={lane} position={[lane * LANE_WIDTH, 1, -obstacle.z]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 2, 0.4]} />
            <meshStandardMaterial
              color="#ff2255"
              emissive="#ff2255"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function LowBarObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <>
      {obstacle.lanes.map((lane) => (
        <group key={lane} position={[lane * LANE_WIDTH, 0.6, -obstacle.z]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 0.3, 0.4]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ffaa00"
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Support posts */}
          {[-0.8, 0.8].map((x) => (
            <mesh key={x} position={[x, -0.3, 0]}>
              <boxGeometry args={[0.1, 0.6, 0.1]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function OverheadObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <>
      {obstacle.lanes.map((lane) => (
        <group key={lane} position={[lane * LANE_WIDTH, 1.8, -obstacle.z]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 1.2, 0.5]} />
            <meshStandardMaterial
              color="#aa00ff"
              emissive="#aa00ff"
              emissiveIntensity={0.4}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function GapObstacle({ obstacle }: { obstacle: Obstacle }) {
  return (
    <>
      {obstacle.lanes.map((lane) => (
        <group key={lane} position={[lane * LANE_WIDTH, -0.5, -obstacle.z]}>
          <mesh>
            <boxGeometry args={[LANE_WIDTH, 1, 3]} />
            <meshStandardMaterial
              color="#000000"
              transparent
              opacity={0}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ObstacleRenderer({ obstacle }: { obstacle: Obstacle }) {
  switch (obstacle.type) {
    case "barrier":
    case "double_barrier":
      return <BarrierObstacle obstacle={obstacle} />;
    case "low_bar":
      return <LowBarObstacle obstacle={obstacle} />;
    case "overhead":
      return <OverheadObstacle obstacle={obstacle} />;
    case "gap":
      return <GapObstacle obstacle={obstacle} />;
    case "moving_barrier":
      return <BarrierObstacle obstacle={obstacle} />;
    default:
      return null;
  }
}

export function Track() {
  const seed = useGameStore((s) => s.seed);
  const processedObstacles = useRef(new Set<number>());

  const obstacles = useMemo(() => {
    return generateObstacles(seed, 0, 500);
  }, [seed]);

  // Reset processed obstacles on new game
  const phase = useGameStore((s) => s.phase);
  useMemo(() => {
    if (phase === "playing") {
      processedObstacles.current.clear();
    }
  }, [phase]);

  // Collision detection via position checking (simpler than physics contacts)
  useFrame(() => {
    if (useGameStore.getState().phase !== "playing") return;

    const playerPos = playerPositionRef.current;
    const playerZ = -playerPos.z; // convert to positive Z for comparison
    const playerLane = Math.round(playerPos.x / LANE_WIDTH);
    const isJumping = useGameStore.getState().isJumping;
    const isSliding = useGameStore.getState().isSliding;
    const isInvulnerable = useGameStore.getState().isInvulnerable;

    for (const obs of obstacles) {
      if (processedObstacles.current.has(obs.z)) continue;

      const dz = Math.abs(playerZ - obs.z);

      // Past the obstacle
      if (playerZ > obs.z + 2) {
        processedObstacles.current.add(obs.z);

        // Near-miss check
        if (dz < 4) {
          const wasInLane = obs.lanes.includes(playerLane);
          const nearLane = obs.lanes.some(
            (l) => Math.abs(l - playerLane) <= 1 && l !== playerLane
          );
          if (nearLane || wasInLane) {
            // They dodged it - could be near miss
          }
        }
        continue;
      }

      // Hit detection
      if (dz < 0.8) {
        const inBlockedLane = obs.lanes.includes(playerLane);
        if (!inBlockedLane) {
          // Check near miss
          const nearLane = obs.lanes.some(
            (l) => Math.abs((l * LANE_WIDTH) - playerPos.x) < NEAR_MISS_THRESHOLD * LANE_WIDTH
          );
          if (nearLane && !processedObstacles.current.has(obs.z)) {
            processedObstacles.current.add(obs.z);
            useGameStore.getState().addCombo();
            useGameStore.getState().addScore(50);
            audio.playNearMiss();
          }
          continue;
        }

        // Player is in a blocked lane
        let canDodge = false;
        if (obs.type === "low_bar" && isJumping) canDodge = true;
        if (obs.type === "low_bar" && isSliding) canDodge = true; // can slide under low bar too
        if (obs.type === "overhead" && isSliding) canDodge = true;
        if (obs.type === "gap" && isJumping) canDodge = true;

        if (canDodge) {
          // Near miss! They jumped/slid through it
          if (!processedObstacles.current.has(obs.z)) {
            processedObstacles.current.add(obs.z);
            useGameStore.getState().addCombo();
            useGameStore.getState().addScore(50);
            audio.playNearMiss();
          }
          continue;
        }

        // HIT
        if (!isInvulnerable && !processedObstacles.current.has(obs.z)) {
          processedObstacles.current.add(obs.z);
          useGameStore.getState().hit();
          audio.playCollapse();
          audio.vibrate([50, 30, 100]);
          useScreenEffects.getState().shake(0.8);
        }
      }
    }
  });

  // Generate road segments
  const roadSegments = useMemo(() => {
    const segs = [];
    for (let i = 0; i < ROAD_SEGMENTS; i++) {
      segs.push(i * ROAD_SEGMENT_LENGTH + ROAD_SEGMENT_LENGTH / 2);
    }
    return segs;
  }, []);

  return (
    <group>
      {roadSegments.map((z) => (
        <RoadSegment key={z} z={z} />
      ))}
      {obstacles.map((obs, i) => (
        <ObstacleRenderer key={i} obstacle={obs} />
      ))}
    </group>
  );
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors (may need to fix imports in other files referencing old Track types)

**Step 4: Commit**

```bash
rm -rf src/components/Game/obstacles/
git add -A src/components/Game/Track.tsx src/components/Game/obstacles/
git commit -m "feat: rewrite track as 3-lane road with obstacle rendering and collision"
```

---

### Task 6: Clean Up Old Code + Wire Everything Together

**Files:**
- Delete: `src/components/Game/BlockStack.tsx`
- Delete: `src/components/Effects/BlockPlaceEffect.tsx`
- Delete: `src/components/Effects/CollapseEffect.tsx`
- Modify: `src/components/Game/GameScene.tsx`
- Modify: `src/components/Game/Environment.tsx`
- Modify: `src/App.tsx`

**Step 1: Delete block-related files**

```bash
rm src/components/Game/BlockStack.tsx
rm src/components/Effects/BlockPlaceEffect.tsx
rm src/components/Effects/CollapseEffect.tsx
```

**Step 2: Update GameScene**

```typescript
// src/components/Game/GameScene.tsx
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";
import { Vector3 } from "three";
import { Player, playerPositionRef } from "./Player";
import { Track } from "./Track";
import { useGameStore } from "../../stores/gameStore";
import { PostProcessing } from "../Effects/PostProcessing";
import { Environment } from "./Environment";
import { useScreenEffects } from "../../systems/screenEffects";

function CameraFollow() {
  const { camera } = useThree();
  const smoothPos = useRef(new Vector3(0, 6, 10));

  useFrame((_, delta) => {
    const phase = useGameStore.getState().phase;
    if (phase !== "playing") return;

    const target = playerPositionRef.current;
    const desired = new Vector3(
      target.x * 0.3,
      target.y + 5,
      target.z + 10
    );

    smoothPos.current.lerp(desired, 1 - Math.exp(-4 * delta));
    camera.position.copy(smoothPos.current);
    camera.lookAt(target.x * 0.2, target.y + 0.5, target.z - 8);

    const shakeIntensity = useScreenEffects.getState().shakeIntensity;
    useScreenEffects.getState().update(delta);
    if (shakeIntensity > 0) {
      camera.position.x += (Math.random() - 0.5) * shakeIntensity * 0.5;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.3;
    }
  });

  return null;
}

export function GameScene() {
  return (
    <Suspense fallback={null}>
      <Environment />
      <PostProcessing />
      <Physics gravity={[0, -30, 0]}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 15, 5]} intensity={0.8} castShadow />
        <pointLight position={[0, 10, -20]} color="#ff00ff" intensity={2} distance={50} />
        <pointLight position={[0, 10, -60]} color="#00ffcc" intensity={2} distance={50} />
        <CameraFollow />
        <Player />
        <Track />
      </Physics>
    </Suspense>
  );
}
```

**Step 3: Update Environment for cyber-city feel**

```typescript
// src/components/Game/Environment.tsx
import { useMemo } from "react";
import { useGameStore } from "../../stores/gameStore";

function CityBuilding({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]}>
      <boxGeometry args={[2, height, 2]} />
      <meshStandardMaterial
        color="#0a0a15"
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

export function Environment() {
  const distance = useGameStore((s) => s.distance);

  const buildings = useMemo(() => {
    const b = [];
    const colors = ["#ff00ff", "#00ffcc", "#ff6600", "#0066ff"];
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -(i * 12);
      const height = 5 + Math.random() * 20;
      b.push({
        position: [side * (8 + Math.random() * 4), 0, z] as [number, number, number],
        height,
        color: colors[i % colors.length],
      });
    }
    return b;
  }, []);

  const fogHue = (distance * 0.5) % 360;

  return (
    <group>
      <fog attach="fog" args={[`hsl(${fogHue}, 50%, 5%)`, 20, 100]} />
      {buildings.map((b, i) => (
        <CityBuilding key={i} {...b} />
      ))}
    </group>
  );
}
```

**Step 4: Update App.tsx — remove block placement tap handler**

```typescript
// src/App.tsx
import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { GameScene } from "./components/Game/GameScene";
import { HUD } from "./components/UI/HUD";
import { MainMenu } from "./components/UI/MainMenu";
import { DeathScreen } from "./components/UI/DeathScreen";
import { useGameStore } from "./stores/gameStore";
import { parseChallengeUrl } from "./systems/challengeSystem";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    const challenge = parseChallengeUrl(window.location.href);
    if (challenge) {
      useGameStore.getState().setSeed(challenge.seed);
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 6, 10], fov: 50 }}
        style={{ background: "#0a0a0f" }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <GameScene />
      </Canvas>

      {phase === "playing" && <HUD />}
      {phase === "menu" && <MainMenu />}
      {phase === "dead" && <DeathScreen />}
    </div>
  );
}
```

**Step 5: Run type check and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: No TS errors, all tests pass

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire up endless runner - remove blocks, update scene/environment/app"
```

---

### Task 7: Update HUD with Combo Counter + HP

**Files:**
- Modify: `src/components/UI/HUD.tsx`

**Step 1: Rewrite HUD**

```typescript
// src/components/UI/HUD.tsx
import { useGameStore, MAX_HP } from "../../stores/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const hp = useGameStore((s) => s.hp);
  const multiplier = useGameStore((s) => s.getMultiplier());

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "16px",
        pointerEvents: "none",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        color: "white",
      }}
    >
      {/* Score */}
      <div
        style={{
          fontSize: "48px",
          fontWeight: 800,
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,255,204,0.5)",
        }}
      >
        {score}
      </div>

      {/* Combo + Multiplier */}
      {combo > 0 && (
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            textAlign: "center",
            color: combo >= 20 ? "#ff00ff" : combo >= 10 ? "#ffaa00" : "#00ffcc",
            textShadow: `0 2px 8px ${combo >= 20 ? "rgba(255,0,255,0.5)" : "rgba(0,255,204,0.5)"}`,
          }}
        >
          {combo}x COMBO {multiplier > 1 ? `(${multiplier}x)` : ""}
        </div>
      )}

      {/* HP Hearts */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: "6px",
          fontSize: "24px",
        }}
      >
        {Array.from({ length: MAX_HP }).map((_, i) => (
          <span
            key={i}
            style={{
              opacity: i < hp ? 1 : 0.2,
              filter: i < hp ? "drop-shadow(0 0 4px #ff2255)" : "none",
            }}
          >
            &#9829;
          </span>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/UI/HUD.tsx
git commit -m "feat: update HUD with combo counter and HP hearts"
```

---

### Task 8: Update Menus + Death Screen

**Files:**
- Modify: `src/components/UI/MainMenu.tsx`
- Modify: `src/components/UI/DeathScreen.tsx`

**Step 1: Update MainMenu**

Change title from "STACK DASH" to "NEON DASH" and update instructions:

In `MainMenu.tsx`:
- Title: `NEON DASH`
- Instructions:
  - Mobile: "Tap left/right to switch lanes"
  - Mobile: "Tap center to jump, swipe down to slide"
  - Desktop: "Arrow keys / WASD to move, Space to jump"
  - "Chain near-misses for combo multipliers!"

**Step 2: Update DeathScreen**

Show combo stats: "Best combo: X" alongside score.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/UI/MainMenu.tsx src/components/UI/DeathScreen.tsx
git commit -m "feat: update menus for Neon Dash branding and runner instructions"
```

---

### Task 9: Dash Trail Effect

**Files:**
- Create: `src/components/Effects/DashTrail.tsx`
- Modify: `src/components/Game/GameScene.tsx` (add DashTrail)

**Step 1: Create DashTrail component**

```typescript
// src/components/Effects/DashTrail.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";
import { playerPositionRef } from "../Game/Player";

const MAX_TRAIL_POINTS = 60;

export function DashTrail() {
  const meshRef = useRef<THREE.Mesh>(null);
  const points = useRef<[number, number, number][]>([]);
  const phase = useGameStore((s) => s.phase);

  useFrame(() => {
    if (phase !== "playing") {
      points.current = [];
      return;
    }

    const combo = useGameStore.getState().combo;
    if (combo < 1) {
      points.current = [];
      return;
    }

    const pos = playerPositionRef.current;
    points.current.push([pos.x, pos.y - 0.3, pos.z]);

    // Trail length scales with combo
    const maxLen = Math.min(MAX_TRAIL_POINTS, 10 + combo * 2);
    while (points.current.length > maxLen) {
      points.current.shift();
    }

    // Update trail mesh geometry
    if (meshRef.current && points.current.length >= 2) {
      const positions = new Float32Array(points.current.length * 3);
      points.current.forEach((p, i) => {
        positions[i * 3] = p[0];
        positions[i * 3 + 1] = p[1];
        positions[i * 3 + 2] = p[2];
      });

      const geo = meshRef.current.geometry;
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geo.setDrawRange(0, points.current.length);
      geo.attributes.position.needsUpdate = true;
    }
  });

  const combo = useGameStore((s) => s.combo);

  // Color based on combo level
  const color =
    combo >= 50
      ? "#ff00ff"
      : combo >= 20
        ? "#ffaa00"
        : combo >= 10
          ? "#00aaff"
          : "#00ffcc";

  return (
    <mesh ref={meshRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color={color}
        linewidth={2}
        transparent
        opacity={Math.min(1, combo * 0.15)}
      />
    </mesh>
  );
}
```

Note: Import `* as THREE` from "three" at the top. The trail uses a simple line — for a fancier effect we can use a tube or ribbon geometry later.

**Step 2: Add to GameScene inside Physics**

Add `<DashTrail />` in the GameScene component.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/Effects/DashTrail.tsx src/components/Game/GameScene.tsx
git commit -m "feat: add neon dash trail effect that scales with combo"
```

---

### Task 10: Final Polish + Run Full Tests

**Files:**
- Various cleanup

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Test locally in browser**

Run: `npx vite --port 3999`
- Verify: Menu shows "NEON DASH" with correct instructions
- Verify: PLAY starts the game, character runs forward
- Verify: Arrow keys switch lanes, space jumps, down slides
- Verify: Obstacles appear and can be dodged
- Verify: Near-miss shows combo in HUD
- Verify: Getting hit reduces hearts
- Verify: 3 hits = death screen
- Verify: AGAIN restarts cleanly

**Step 4: Build for production**

Run: `npx vite build`
Expected: Build succeeds

**Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: Neon Dash endless runner - complete pivot from block stacking"
git push origin main
```
