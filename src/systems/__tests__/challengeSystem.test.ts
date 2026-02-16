import { describe, it, expect } from "vitest";
import { encodeSeed, decodeSeed, buildChallengeUrl, parseChallengeUrl } from "../challengeSystem";

describe("challengeSystem", () => {
  it("encodes and decodes seed symmetrically", () => {
    const seed = 1234567890;
    const encoded = encodeSeed(seed);
    expect(decodeSeed(encoded)).toBe(seed);
  });

  it("generates short encoded strings", () => {
    const encoded = encodeSeed(Date.now());
    expect(encoded.length).toBeLessThan(15);
  });

  it("builds and parses challenge URL", () => {
    const seed = 42;
    const score = 1500;
    const url = buildChallengeUrl(seed, score);
    const parsed = parseChallengeUrl(url);
    expect(parsed?.seed).toBe(seed);
    expect(parsed?.score).toBe(score);
  });

  it("returns null for invalid URL", () => {
    expect(parseChallengeUrl("not-a-url")).toBeNull();
  });

  it("returns null for URL without challenge params", () => {
    expect(parseChallengeUrl("https://example.com")).toBeNull();
  });
});
