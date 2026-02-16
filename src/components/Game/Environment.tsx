import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../../stores/gameStore";
import { Fog } from "three";

export function Environment() {
  const fogRef = useRef<Fog>(null);
  const distance = useGameStore((s) => s.distance);

  useFrame(() => {
    if (!fogRef.current) return;
    const hue = (distance * 0.001) % 1;
    fogRef.current.color.setHSL(hue, 0.3, 0.05);
  });

  return (
    <>
      <fog ref={fogRef} attach="fog" args={["#0a0a0f", 20, 80]} />
      <color attach="background" args={["#0a0a0f"]} />
    </>
  );
}
