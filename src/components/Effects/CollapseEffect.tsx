import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

interface CollapseParticle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  life: number;
  scale: number;
}

let collapseParticleId = 0;

export function useCollapseEffect() {
  const [particles, setParticles] = useState<CollapseParticle[]>([]);

  const emit = (position: [number, number, number]) => {
    const newParticles: CollapseParticle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: ++collapseParticleId,
        position: new Vector3(...position),
        velocity: new Vector3(
          Math.cos(angle) * speed,
          Math.random() * 5 + 2,
          Math.sin(angle) * speed
        ),
        life: 1,
        scale: 0.1 + Math.random() * 0.2,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  return { particles, setParticles, emit };
}

export function CollapseParticles({
  particles,
  setParticles,
}: {
  particles: CollapseParticle[];
  setParticles: React.Dispatch<React.SetStateAction<CollapseParticle[]>>;
}) {
  useFrame((_, delta) => {
    if (particles.length === 0) return;
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          position: p.position
            .clone()
            .add(p.velocity.clone().multiplyScalar(delta)),
          velocity: p.velocity
            .clone()
            .add(new Vector3(0, -8 * delta, 0)),
          life: p.life - delta * 1.5,
        }))
        .filter((p) => p.life > 0)
    );
  });

  return (
    <group>
      {particles.map((p) => (
        <mesh key={p.id} position={p.position} scale={p.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ff3300"
            emissive="#ff6600"
            emissiveIntensity={2}
            transparent
            opacity={p.life}
          />
        </mesh>
      ))}
    </group>
  );
}
