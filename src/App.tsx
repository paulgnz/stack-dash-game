import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense } from "react";

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 8, 12], fov: 50 }}
      style={{ background: "#0a0a0f" }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[10, 1, 50]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        </Physics>
      </Suspense>
    </Canvas>
  );
}
