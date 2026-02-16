import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

interface Particle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  life: number;
}

let particleId = 0;

export function useBlockPlaceEffect() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const emit = (position: [number, number, number]) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      newParticles.push({
        id: ++particleId,
        position: new Vector3(...position),
        velocity: new Vector3(
          Math.cos(angle) * 2,
          Math.random() * 3 + 1,
          Math.sin(angle) * 2
        ),
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  return { particles, setParticles, emit };
}

export function BlockParticles({
  particles,
  setParticles,
}: {
  particles: Particle[];
  setParticles: React.Dispatch<React.SetStateAction<Particle[]>>;
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
            .add(new Vector3(0, -10 * delta, 0)),
          life: p.life - delta * 2,
        }))
        .filter((p) => p.life > 0)
    );
  });

  return (
    <group>
      {particles.map((p) => (
        <mesh key={p.id} position={p.position}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff6600"
            emissiveIntensity={1}
            transparent
            opacity={p.life}
          />
        </mesh>
      ))}
    </group>
  );
}
