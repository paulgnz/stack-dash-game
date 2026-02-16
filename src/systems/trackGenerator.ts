import { SeededRandom } from "../utils/seededRandom";

// ── Legacy types (kept for backward compatibility with existing components) ──

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
  z: number;
  length: number;
  width: number;
  height?: number;
  speed?: number;
  direction?: [number, number, number];
}

const SEGMENT_UNLOCK: Record<SegmentType, number> = {
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
    const available = (Object.entries(SEGMENT_UNLOCK) as [SegmentType, number][])
      .filter(([, dist]) => Math.abs(fromZ) >= dist)
      .map(([type]) => type);

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

// ── New obstacle-based track generator ──

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
  lanes: number[];
  speed?: number;
}

const OBSTACLE_UNLOCK: Record<ObstacleType, number> = {
  barrier: 0,
  low_bar: 0,
  gap: 50,
  double_barrier: 100,
  overhead: 200,
  moving_barrier: 400,
};

const ALL_LANES = [-1, 0, 1] as const;

const MIN_GAP = 12;
const MAX_EXTRA_GAP = 8;
const INITIAL_OFFSET = 20;

function getAvailableTypes(z: number): ObstacleType[] {
  return (Object.entries(OBSTACLE_UNLOCK) as [ObstacleType, number][])
    .filter(([, threshold]) => z >= threshold)
    .map(([type]) => type);
}

function createObstacle(type: ObstacleType, z: number, rng: SeededRandom): Obstacle {
  switch (type) {
    case "barrier":
      return { type, z, lanes: [rng.pick([...ALL_LANES])] };

    case "low_bar":
      return { type, z, lanes: [rng.pick([...ALL_LANES])] };

    case "gap":
      return { type, z, lanes: [rng.pick([...ALL_LANES])] };

    case "overhead":
      return { type, z, lanes: [rng.pick([...ALL_LANES])] };

    case "double_barrier": {
      const safeLane = rng.pick([...ALL_LANES]);
      const blocked = ALL_LANES.filter((l) => l !== safeLane);
      return { type, z, lanes: [...blocked] };
    }

    case "moving_barrier": {
      const speed = rng.range(1, 3);
      return { type, z, lanes: [rng.pick([...ALL_LANES])], speed };
    }
  }
}

export function generateObstacles(
  seed: number,
  fromZ: number,
  toZ: number
): Obstacle[] {
  const rng = new SeededRandom(seed + Math.floor(fromZ));
  const obstacles: Obstacle[] = [];
  let z = fromZ + INITIAL_OFFSET;
  let lastType: ObstacleType | null = null;

  while (z <= toZ) {
    let available = getAvailableTypes(z);

    // Prevent back-to-back double_barriers (impossible to dodge)
    if (lastType === "double_barrier") {
      available = available.filter((t) => t !== "double_barrier");
    }

    // Early game: only simple obstacles for the first 30 units
    if (z < 30) {
      available = available.filter((t) => t === "barrier" || t === "low_bar");
    }

    const type = rng.pick(available);
    const obstacle = createObstacle(type, z, rng);
    obstacles.push(obstacle);
    lastType = type;

    // More space after double_barriers so player can reposition
    const extraGap = rng.range(0, MAX_EXTRA_GAP);
    const gap = type === "double_barrier" ? MIN_GAP + 6 : MIN_GAP;
    z += gap + extraGap;
  }

  return obstacles;
}
