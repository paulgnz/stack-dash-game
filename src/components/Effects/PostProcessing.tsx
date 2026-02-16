import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
      />
      <Vignette offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}
