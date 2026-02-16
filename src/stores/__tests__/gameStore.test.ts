import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, LANE_WIDTH, BASE_SPEED, MAX_HP, getMultiplier } from "../gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe("exported constants", () => {
    it("exports LANE_WIDTH as 2.5", () => {
      expect(LANE_WIDTH).toBe(2.5);
    });

    it("exports BASE_SPEED as 8", () => {
      expect(BASE_SPEED).toBe(8);
    });

    it("exports MAX_HP as 3", () => {
      expect(MAX_HP).toBe(3);
    });
  });

  describe("initial state", () => {
    it("starts in menu phase", () => {
      const state = useGameStore.getState();
      expect(state.phase).toBe("menu");
    });

    it("starts with score 0", () => {
      expect(useGameStore.getState().score).toBe(0);
    });

    it("starts with hp equal to MAX_HP", () => {
      expect(useGameStore.getState().hp).toBe(MAX_HP);
    });

    it("starts with combo 0", () => {
      expect(useGameStore.getState().combo).toBe(0);
    });

    it("starts in center lane", () => {
      expect(useGameStore.getState().lane).toBe(0);
    });

    it("starts not jumping", () => {
      expect(useGameStore.getState().isJumping).toBe(false);
    });

    it("starts not sliding", () => {
      expect(useGameStore.getState().isSliding).toBe(false);
    });

    it("starts not invulnerable", () => {
      expect(useGameStore.getState().isInvulnerable).toBe(false);
    });

    it("starts with base speed", () => {
      expect(useGameStore.getState().speed).toBe(BASE_SPEED);
    });

    it("starts with distance 0", () => {
      expect(useGameStore.getState().distance).toBe(0);
    });
  });

  describe("start()", () => {
    it("transitions to playing phase", () => {
      useGameStore.getState().start();
      expect(useGameStore.getState().phase).toBe("playing");
    });

    it("resets hp to MAX_HP", () => {
      useGameStore.getState().start();
      // Simulate taking damage then restarting
      useGameStore.getState().hit();
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().hp).toBe(MAX_HP);
    });

    it("resets combo to 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addCombo();
      useGameStore.getState().addCombo();
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().combo).toBe(0);
    });

    it("resets lane to center", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(1);
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().lane).toBe(0);
    });

    it("resets all booleans to false", () => {
      useGameStore.getState().start();
      useGameStore.getState().setJumping(true);
      useGameStore.getState().setSliding(true);
      useGameStore.getState().setInvulnerable(true);
      useGameStore.getState().die();
      useGameStore.getState().start();
      const state = useGameStore.getState();
      expect(state.isJumping).toBe(false);
      expect(state.isSliding).toBe(false);
      expect(state.isInvulnerable).toBe(false);
    });

    it("resets score to 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(100);
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().score).toBe(0);
    });

    it("resets speed to BASE_SPEED", () => {
      useGameStore.getState().start();
      useGameStore.getState().addDistance(500);
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().speed).toBe(BASE_SPEED);
    });

    it("resets distance to 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addDistance(100);
      useGameStore.getState().die();
      useGameStore.getState().start();
      expect(useGameStore.getState().distance).toBe(0);
    });
  });

  describe("hit()", () => {
    it("reduces HP by 1", () => {
      useGameStore.getState().start();
      useGameStore.getState().hit();
      expect(useGameStore.getState().hp).toBe(MAX_HP - 1);
    });

    it("resets combo to 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addCombo();
      useGameStore.getState().addCombo();
      useGameStore.getState().addCombo();
      expect(useGameStore.getState().combo).toBe(3);
      useGameStore.getState().hit();
      expect(useGameStore.getState().combo).toBe(0);
    });

    it("triggers death when HP reaches 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(200);
      useGameStore.getState().hit(); // HP = 2
      useGameStore.getState().hit(); // HP = 1
      useGameStore.getState().hit(); // HP = 0, should die
      const state = useGameStore.getState();
      expect(state.hp).toBe(0);
      expect(state.phase).toBe("dead");
      expect(state.finalScore).toBe(200);
    });

    it("does not go below 0 HP", () => {
      useGameStore.getState().start();
      useGameStore.getState().hit();
      useGameStore.getState().hit();
      useGameStore.getState().hit();
      expect(useGameStore.getState().hp).toBe(0);
    });
  });

  describe("addCombo()", () => {
    it("increments combo by 1", () => {
      useGameStore.getState().start();
      useGameStore.getState().addCombo();
      expect(useGameStore.getState().combo).toBe(1);
    });

    it("increments multiple times", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().addCombo();
      }
      expect(useGameStore.getState().combo).toBe(10);
    });
  });

  describe("resetCombo()", () => {
    it("sets combo to 0", () => {
      useGameStore.getState().start();
      useGameStore.getState().addCombo();
      useGameStore.getState().addCombo();
      useGameStore.getState().addCombo();
      useGameStore.getState().resetCombo();
      expect(useGameStore.getState().combo).toBe(0);
    });
  });

  describe("getMultiplier()", () => {
    it("returns 1x for combo < 5", () => {
      expect(getMultiplier(0)).toBe(1);
      expect(getMultiplier(4)).toBe(1);
    });

    it("returns 1.5x for combo >= 5", () => {
      expect(getMultiplier(5)).toBe(1.5);
      expect(getMultiplier(9)).toBe(1.5);
    });

    it("returns 2x for combo >= 10", () => {
      expect(getMultiplier(10)).toBe(2);
      expect(getMultiplier(19)).toBe(2);
    });

    it("returns 3x for combo >= 20", () => {
      expect(getMultiplier(20)).toBe(3);
      expect(getMultiplier(49)).toBe(3);
    });

    it("returns 5x for combo >= 50", () => {
      expect(getMultiplier(50)).toBe(5);
      expect(getMultiplier(100)).toBe(5);
    });
  });

  describe("switchLane()", () => {
    it("switches lane right from center", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(1);
      expect(useGameStore.getState().lane).toBe(1);
    });

    it("switches lane left from center", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(-1);
      expect(useGameStore.getState().lane).toBe(-1);
    });

    it("clamps lane to 1 (right max)", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(1);
      useGameStore.getState().switchLane(1);
      expect(useGameStore.getState().lane).toBe(1);
    });

    it("clamps lane to -1 (left max)", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(-1);
      useGameStore.getState().switchLane(-1);
      expect(useGameStore.getState().lane).toBe(-1);
    });

    it("moves from right back to center", () => {
      useGameStore.getState().start();
      useGameStore.getState().switchLane(1);
      useGameStore.getState().switchLane(-1);
      expect(useGameStore.getState().lane).toBe(0);
    });
  });

  describe("setJumping()", () => {
    it("sets isJumping to true", () => {
      useGameStore.getState().start();
      useGameStore.getState().setJumping(true);
      expect(useGameStore.getState().isJumping).toBe(true);
    });

    it("sets isJumping to false", () => {
      useGameStore.getState().start();
      useGameStore.getState().setJumping(true);
      useGameStore.getState().setJumping(false);
      expect(useGameStore.getState().isJumping).toBe(false);
    });
  });

  describe("setSliding()", () => {
    it("sets isSliding to true", () => {
      useGameStore.getState().start();
      useGameStore.getState().setSliding(true);
      expect(useGameStore.getState().isSliding).toBe(true);
    });

    it("sets isSliding to false", () => {
      useGameStore.getState().start();
      useGameStore.getState().setSliding(true);
      useGameStore.getState().setSliding(false);
      expect(useGameStore.getState().isSliding).toBe(false);
    });
  });

  describe("setInvulnerable()", () => {
    it("sets isInvulnerable to true", () => {
      useGameStore.getState().start();
      useGameStore.getState().setInvulnerable(true);
      expect(useGameStore.getState().isInvulnerable).toBe(true);
    });

    it("sets isInvulnerable to false", () => {
      useGameStore.getState().start();
      useGameStore.getState().setInvulnerable(true);
      useGameStore.getState().setInvulnerable(false);
      expect(useGameStore.getState().isInvulnerable).toBe(false);
    });
  });

  describe("addScore()", () => {
    it("adds points with no combo (1x multiplier)", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(100);
    });

    it("applies 1.5x multiplier at combo 5", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 5; i++) {
        useGameStore.getState().addCombo();
      }
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(150);
    });

    it("applies 2x multiplier at combo 10", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().addCombo();
      }
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(200);
    });

    it("applies 3x multiplier at combo 20", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 20; i++) {
        useGameStore.getState().addCombo();
      }
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(300);
    });

    it("applies 5x multiplier at combo 50", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 50; i++) {
        useGameStore.getState().addCombo();
      }
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(500);
    });

    it("rounds score correctly", () => {
      useGameStore.getState().start();
      for (let i = 0; i < 5; i++) {
        useGameStore.getState().addCombo();
      }
      // 1.5x * 7 = 10.5, should round to 11
      useGameStore.getState().addScore(7);
      expect(useGameStore.getState().score).toBe(Math.round(7 * 1.5));
    });

    it("accumulates score across multiple calls", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(100);
      useGameStore.getState().addScore(100);
      expect(useGameStore.getState().score).toBe(200);
    });
  });

  describe("addDistance()", () => {
    it("increases distance", () => {
      useGameStore.getState().start();
      useGameStore.getState().addDistance(50);
      expect(useGameStore.getState().distance).toBe(50);
    });

    it("increases speed with distance", () => {
      useGameStore.getState().start();
      useGameStore.getState().addDistance(100);
      expect(useGameStore.getState().speed).toBeGreaterThan(BASE_SPEED);
    });

    it("accumulates distance", () => {
      useGameStore.getState().start();
      useGameStore.getState().addDistance(50);
      useGameStore.getState().addDistance(50);
      expect(useGameStore.getState().distance).toBe(100);
    });
  });

  describe("die()", () => {
    it("sets phase to dead", () => {
      useGameStore.getState().start();
      useGameStore.getState().die();
      expect(useGameStore.getState().phase).toBe("dead");
    });

    it("captures finalScore", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(500);
      useGameStore.getState().die();
      expect(useGameStore.getState().finalScore).toBe(500);
    });

    it("updates bestScore if current score is higher", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(500);
      useGameStore.getState().die();
      expect(useGameStore.getState().bestScore).toBe(500);
    });

    it("preserves bestScore if current score is lower", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(500);
      useGameStore.getState().die();
      useGameStore.getState().reset();
      useGameStore.getState().start();
      useGameStore.getState().addScore(300);
      useGameStore.getState().die();
      expect(useGameStore.getState().bestScore).toBe(500);
    });
  });

  describe("reset()", () => {
    it("resets phase to menu", () => {
      useGameStore.getState().start();
      useGameStore.getState().die();
      useGameStore.getState().reset();
      expect(useGameStore.getState().phase).toBe("menu");
    });

    it("resets all runner state", () => {
      useGameStore.getState().start();
      useGameStore.getState().addScore(999);
      useGameStore.getState().addDistance(500);
      useGameStore.getState().addCombo();
      useGameStore.getState().switchLane(1);
      useGameStore.getState().setJumping(true);
      useGameStore.getState().setSliding(true);
      useGameStore.getState().setInvulnerable(true);
      useGameStore.getState().hit();
      useGameStore.getState().reset();

      const state = useGameStore.getState();
      expect(state.phase).toBe("menu");
      expect(state.score).toBe(0);
      expect(state.finalScore).toBe(0);
      expect(state.hp).toBe(MAX_HP);
      expect(state.combo).toBe(0);
      expect(state.lane).toBe(0);
      expect(state.isJumping).toBe(false);
      expect(state.isSliding).toBe(false);
      expect(state.isInvulnerable).toBe(false);
      expect(state.speed).toBe(BASE_SPEED);
      expect(state.distance).toBe(0);
    });
  });

  describe("setSeed()", () => {
    it("sets the seed value", () => {
      useGameStore.getState().setSeed(42);
      expect(useGameStore.getState().seed).toBe(42);
    });
  });
});
