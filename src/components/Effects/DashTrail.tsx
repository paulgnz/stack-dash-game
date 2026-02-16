import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../stores/gameStore";
import { playerPositionRef } from "../Game/Player";

const MAX_TRAIL_POINTS = 60;

function getTrailColor(combo: number): string {
  if (combo >= 50) return "#ff00ff";
  if (combo >= 20) return "#ffaa00";
  if (combo >= 10) return "#00aaff";
  return "#00ffcc";
}

export function DashTrail() {
  const lineRef = useRef<THREE.Line>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const points = useRef<number[]>([]); // flat array [x,y,z, x,y,z, ...]
  const phase = useGameStore((s) => s.phase);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posArray = new Float32Array(MAX_TRAIL_POINTS * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  useFrame(() => {
    if (!lineRef.current || !materialRef.current) return;

    if (phase !== "playing") {
      points.current = [];
      geometry.setDrawRange(0, 0);
      return;
    }

    const combo = useGameStore.getState().combo;
    if (combo < 1) {
      points.current = [];
      geometry.setDrawRange(0, 0);
      return;
    }

    const pos = playerPositionRef.current;
    points.current.push(pos.x, pos.y - 0.3, pos.z);

    const maxLen = Math.min(MAX_TRAIL_POINTS, 10 + combo * 2);
    while (points.current.length > maxLen * 3) {
      points.current.splice(0, 3);
    }

    const posAttr = geometry.getAttribute("position");
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < points.current.length && i < arr.length; i++) {
      arr[i] = points.current[i];
    }
    posAttr.needsUpdate = true;
    geometry.setDrawRange(0, Math.floor(points.current.length / 3));

    // Update color and opacity based on combo
    materialRef.current.color.set(getTrailColor(combo));
    materialRef.current.opacity = Math.min(1, combo * 0.15);
  });

  return (
    <threeLine ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color="#00ffcc"
        transparent
        opacity={0}
      />
    </threeLine>
  );
}
