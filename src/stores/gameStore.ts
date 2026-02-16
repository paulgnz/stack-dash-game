import { create } from "zustand";

export type GamePhase = "menu" | "playing" | "dead";

export const LANE_WIDTH = 2.5;
export const BASE_SPEED = 8;
export const MAX_HP = 3;

const SPEED_INCREMENT = 0.5; // per 100 distance

export function getMultiplier(combo: number): number {
  if (combo >= 50) return 5;
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  if (combo >= 5) return 1.5;
  return 1;
}

interface GameState {
  // State
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
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  isInvulnerable: boolean;

  // Actions
  start: () => void;
  die: () => void;
  reset: () => void;
  addScore: (points: number) => void;
  addDistance: (delta: number) => void;
  setSeed: (seed: number) => void;

  // Runner actions
  addCombo: () => void;
  resetCombo: () => void;
  hit: () => void;
  switchLane: (direction: number) => void;
  setJumping: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  setInvulnerable: (v: boolean) => void;
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
      seed: Date.now(),
      hp: MAX_HP,
      combo: 0,
      lane: 0,
      isJumping: false,
      isSliding: false,
      isInvulnerable: false,
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

  setSeed: (seed: number) => set({ seed }),

  addCombo: () => set((s) => ({ combo: s.combo + 1 })),

  resetCombo: () => set({ combo: 0 }),

  hit: () => {
    const { hp } = get();
    const newHp = Math.max(0, hp - 1);
    set({ hp: newHp, combo: 0 });
    if (newHp <= 0) {
      get().die();
    }
  },

  switchLane: (direction: number) =>
    set((s) => ({
      lane: Math.max(-1, Math.min(1, s.lane + direction)),
    })),

  setJumping: (v: boolean) => set({ isJumping: v }),

  setSliding: (v: boolean) => set({ isSliding: v }),

  setInvulnerable: (v: boolean) => set({ isInvulnerable: v }),
}));
