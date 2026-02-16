import { describe, it, expect } from "vitest";
import { generateTrackSegments, TrackSegment } from "../trackGenerator";

describe("trackGenerator", () => {
  it("generates deterministic segments from same seed", () => {
    const a = generateTrackSegments(42, 0, 20);
    const b = generateTrackSegments(42, 0, 20);
    expect(a).toEqual(b);
  });

  it("generates segments with valid types", () => {
    const segments = generateTrackSegments(123, 0, 20);
    const validTypes = ["platform", "gap", "tunnel", "moving_wall", "crumbling", "wind", "hammer", "gravity_flip"];
    for (const seg of segments) {
      expect(validTypes).toContain(seg.type);
    }
  });

  it("generates segments covering the requested z range", () => {
    const segments = generateTrackSegments(123, 0, 100);
    const lastSeg = segments[segments.length - 1];
    expect(lastSeg.z + lastSeg.length).toBeGreaterThanOrEqual(100);
  });

  it("early segments only contain basic obstacle types", () => {
    const segments = generateTrackSegments(123, 0, 30);
    const advancedTypes = ["wind", "hammer", "gravity_flip"];
    for (const seg of segments) {
      expect(advancedTypes).not.toContain(seg.type);
    }
  });

  it("generates different segments for different seeds", () => {
    const a = generateTrackSegments(1, 0, 50);
    const b = generateTrackSegments(2, 0, 50);
    expect(a).not.toEqual(b);
  });
});
