import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";
import { Fog } from "three";

const NEON_COLORS = ["#ff00ff", "#00ffcc", "#ff6600", "#0066ff"] as const;
const BUILDING_COUNT = 40;
const BUILDING_SPACING = 12;

interface BuildingData {
  x: number;
  z: number;
  width: number;
  height: number;
  colorIndex: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateBuildings(): BuildingData[] {
  const buildings: BuildingData[] = [];

  for (let i = 0; i < BUILDING_COUNT; i++) {
    const rng1 = seededRandom(i * 17 + 1);
    const rng2 = seededRandom(i * 23 + 2);
    const rng3 = seededRandom(i * 31 + 3);
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (8 + rng1 * 4);
    const z = -(i * BUILDING_SPACING);
    const height = 5 + rng2 * 20;
    const width = 2;
    const colorIndex = Math.floor(rng3 * NEON_COLORS.length) % NEON_COLORS.length;

    buildings.push({ x, z, width, height, colorIndex });

    // Add a second building on the other side
    const rng5 = seededRandom(i * 41 + 5);
    const rng6 = seededRandom(i * 43 + 6);
    const rng7 = seededRandom(i * 47 + 7);
    buildings.push({
      x: -side * (8 + rng5 * 4),
      z: z - rng6 * 6,
      width: 2,
      height: 5 + rng7 * 20,
      colorIndex: (colorIndex + 1) % NEON_COLORS.length,
    });
  }

  return buildings;
}

function Building({ data }: { data: BuildingData }) {
  const color = NEON_COLORS[data.colorIndex];
  return (
    <mesh position={[data.x, data.height / 2, data.z]}>
      <boxGeometry args={[data.width, data.height, data.width]} />
      <meshStandardMaterial
        color="#0a0a15"
        emissive={color}
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

export function Environment() {
  const fogRef = useRef<Fog>(null);
  const distance = useGameStore((s) => s.distance);

  const buildings = useMemo(() => generateBuildings(), []);

  useFrame(() => {
    if (!fogRef.current) return;
    const hue = (distance * 0.001) % 1;
    fogRef.current.color.setHSL(hue, 0.3, 0.05);
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#0a0a0f", 20, 80]} />
      <color attach="background" args={["#0a0a0f"]} />

      {/* City buildings */}
      {buildings.map((b, i) => (
        <Building key={i} data={b} />
      ))}
    </>
  );
}
