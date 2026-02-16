export const PHYSICS = {
  gravity: -20,
  blockSize: [0.8, 0.4, 0.8] as const, // width, height, depth
  wideBlockSize: [1.6, 0.4, 1.6] as const,
  blockRestitution: 0.05, // very low bounce
  blockFriction: 0.8, // high grip
  blockMass: 0.5,
  placementCooldown: 0.3, // seconds
  wobbleThreshold: 45, // degrees before "unstable" visual
};
