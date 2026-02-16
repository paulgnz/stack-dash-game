import { SeededRandom } from "../utils/seededRandom";

export type SegmentType =
  | "platform"
  | "gap"
  | "tunnel"
  | "moving_wall"
  | "crumbling"
  | "wind"
  | "hammer"
  | "gravity_flip";

export interface TrackSegment {
  type: SegmentType;
  z: number; // start z position (negative = forward)
  length: number;
  width: number;
  height?: number; // for tunnels
  speed?: number; // for moving walls
  direction?: [number, number, number]; // for wind
}

// Which obstacles unlock at which cumulative distance
const OBSTACLE_UNLOCK: Record<SegmentType, number> = {
  platform: 0,
  gap: 0,
  tunnel: 30,
  moving_wall: 80,
  crumbling: 150,
  wind: 250,
  hammer: 400,
  gravity_flip: 600,
};

export function generateTrackSegments(
  seed: number,
  fromZ: number,
  toZ: number
): TrackSegment[] {
  const rng = new SeededRandom(seed + Math.floor(fromZ));
  const segments: TrackSegment[] = [];
  let z = fromZ;

  while (z < toZ) {
    // Determine available obstacle types based on distance
    const available = (Object.entries(OBSTACLE_UNLOCK) as [SegmentType, number][])
      .filter(([, dist]) => Math.abs(fromZ) >= dist)
      .map(([type]) => type);

    // Weighted selection: platforms are more common
    const weights: Record<string, number> = { platform: 5 };
    const pool: SegmentType[] = [];
    for (const type of available) {
      const w = weights[type] ?? 1;
      for (let i = 0; i < w; i++) pool.push(type);
    }

    const type = rng.pick(pool);
    const length = type === "gap" ? rng.range(2, 4) : rng.range(5, 15);
    const width = type === "gap" ? 4 : rng.range(3, 5);

    const segment: TrackSegment = { type, z, length, width };

    if (type === "tunnel") segment.height = rng.range(2, 4);
    if (type === "moving_wall") segment.speed = rng.range(1, 3);
    if (type === "wind") segment.direction = [rng.range(-1, 1), 0, 0];

    segments.push(segment);
    z += length;
  }

  return segments;
}
