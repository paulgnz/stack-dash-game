import { describe, it, expect } from "vitest";
import { getTapZone, mapKeyToAction } from "../inputSystem";

describe("getTapZone", () => {
  const W = 900;
  const H = 600;

  it("returns move_left for tap in left third", () => {
    expect(getTapZone(0, 300, W, H)).toBe("move_left");
    expect(getTapZone(150, 100, W, H)).toBe("move_left");
    expect(getTapZone(299, 500, W, H)).toBe("move_left");
  });

  it("returns jump for tap in center third", () => {
    expect(getTapZone(300, 300, W, H)).toBe("jump");
    expect(getTapZone(450, 200, W, H)).toBe("jump");
    expect(getTapZone(599, 400, W, H)).toBe("jump");
  });

  it("returns move_right for tap in right third", () => {
    expect(getTapZone(600, 300, W, H)).toBe("move_right");
    expect(getTapZone(750, 100, W, H)).toBe("move_right");
    expect(getTapZone(899, 0, W, H)).toBe("move_right");
  });

  it("handles exact boundary between left and center", () => {
    // x = W/3 = 300 should be center
    expect(getTapZone(300, 300, W, H)).toBe("jump");
  });

  it("handles exact boundary between center and right", () => {
    // x = 2*W/3 = 600 should be right
    expect(getTapZone(600, 300, W, H)).toBe("move_right");
  });
});

describe("mapKeyToAction", () => {
  it("maps ArrowLeft to move_left", () => {
    expect(mapKeyToAction("ArrowLeft")).toBe("move_left");
  });

  it("maps ArrowRight to move_right", () => {
    expect(mapKeyToAction("ArrowRight")).toBe("move_right");
  });

  it("maps ArrowUp to jump", () => {
    expect(mapKeyToAction("ArrowUp")).toBe("jump");
  });

  it("maps ArrowDown to slide", () => {
    expect(mapKeyToAction("ArrowDown")).toBe("slide");
  });

  it("maps 'a' to move_left", () => {
    expect(mapKeyToAction("a")).toBe("move_left");
  });

  it("maps 'd' to move_right", () => {
    expect(mapKeyToAction("d")).toBe("move_right");
  });

  it("maps 'w' to jump", () => {
    expect(mapKeyToAction("w")).toBe("jump");
  });

  it("maps 's' to slide", () => {
    expect(mapKeyToAction("s")).toBe("slide");
  });

  it("maps space to jump", () => {
    expect(mapKeyToAction(" ")).toBe("jump");
  });

  it("returns null for unknown keys", () => {
    expect(mapKeyToAction("x")).toBeNull();
    expect(mapKeyToAction("Enter")).toBeNull();
    expect(mapKeyToAction("Shift")).toBeNull();
  });
});
