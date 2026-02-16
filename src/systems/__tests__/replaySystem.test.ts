import { describe, it, expect } from "vitest";
import { ReplayBuffer } from "../replaySystem";

describe("ReplayBuffer", () => {
  it("records frames up to max capacity", () => {
    const buffer = new ReplayBuffer(5);
    for (let i = 0; i < 10; i++) {
      buffer.push({ time: i, playerPos: [0, 0, -i], blocks: [], score: i * 10 });
    }
    expect(buffer.getFrames().length).toBe(5);
    expect(buffer.getFrames()[0].time).toBe(5); // oldest kept
  });

  it("finds highlight frame (highest score)", () => {
    const buffer = new ReplayBuffer(100);
    buffer.push({ time: 0, playerPos: [0, 0, 0], blocks: [], score: 10 });
    buffer.push({ time: 1, playerPos: [0, 0, -1], blocks: [], score: 50 });
    buffer.push({ time: 2, playerPos: [0, 0, -2], blocks: [], score: 30 });
    const highlight = buffer.getHighlightWindow(2);
    expect(highlight[0].score).toBe(50);
  });

  it("clears all frames", () => {
    const buffer = new ReplayBuffer(100);
    buffer.push({ time: 0, playerPos: [0, 0, 0], blocks: [], score: 10 });
    buffer.clear();
    expect(buffer.getFrames().length).toBe(0);
  });

  it("returns empty array for empty buffer highlight", () => {
    const buffer = new ReplayBuffer(100);
    expect(buffer.getHighlightWindow(5)).toEqual([]);
  });
});
