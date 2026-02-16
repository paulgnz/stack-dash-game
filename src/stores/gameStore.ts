import { create } from "zustand";

export type GamePhase = "menu" | "playing" | "dead";

interface GameState {
  // State
  phase: GamePhase;
  score: number;
  finalScore: number;
  bestScore: number;
  stackHeight: number;
  speed: number;
  distance: number;
  canPlaceBlock: boolean;
  blockCooldownTimer: number;
  seed: number;

  // Actions
  start: () => void;
  die: () => void;
  reset: () => void;
  addScore: (points: number) => void;
  setStackHeight: (height: number) => void;
  addDistance: (delta: number) => void;
  placeBlock: () => void;
  resetBlockCooldown: () => void;
  setSeed: (seed: number) => void;
}

const BASE_SPEED = 5;
const SPEED_INCREMENT = 0.5; // per 100 distance
const BLOCK_COOLDOWN = 0.3; // seconds

function getMultiplier(stackHeight: number): number {
  return 1 + Math.floor(stackHeight / 5) * 0.5;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: "menu",
  score: 0,
  finalScore: 0,
  bestScore: 0,
  stackHeight: 0,
  speed: BASE_SPEED,
  distance: 0,
  canPlaceBlock: true,
  blockCooldownTimer: 0,
  seed: Date.now(),

  start: () =>
    set({
      phase: "playing",
      score: 0,
      stackHeight: 0,
      speed: BASE_SPEED,
      distance: 0,
      canPlaceBlock: true,
      blockCooldownTimer: 0,
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
      stackHeight: 0,
      speed: BASE_SPEED,
      distance: 0,
      canPlaceBlock: true,
      blockCooldownTimer: 0,
    }),

  addScore: (points: number) => {
    const multiplier = getMultiplier(get().stackHeight);
    set((s) => ({ score: s.score + Math.round(points * multiplier) }));
  },

  setStackHeight: (height: number) => set({ stackHeight: height }),

  addDistance: (delta: number) =>
    set((s) => {
      const newDistance = s.distance + delta;
      return {
        distance: newDistance,
        speed: BASE_SPEED + Math.floor(newDistance / 100) * SPEED_INCREMENT,
      };
    }),

  placeBlock: () => set({ canPlaceBlock: false, blockCooldownTimer: BLOCK_COOLDOWN }),

  resetBlockCooldown: () => set({ canPlaceBlock: true, blockCooldownTimer: 0 }),

  setSeed: (seed: number) => set({ seed }),
}));
