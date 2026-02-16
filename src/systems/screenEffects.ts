import { create } from "zustand";

interface ScreenEffectsState {
  shakeIntensity: number;
  slowMotionScale: number;
  shake: (intensity: number) => void;
  slowMotion: (duration: number) => void;
  update: (delta: number) => void;
}

export const useScreenEffects = create<ScreenEffectsState>((set, get) => ({
  shakeIntensity: 0,
  slowMotionScale: 1,

  shake: (intensity) => set({ shakeIntensity: intensity }),

  slowMotion: (duration) => {
    set({ slowMotionScale: 0.2 });
    setTimeout(() => set({ slowMotionScale: 1 }), duration * 1000);
  },

  update: (delta) => {
    const { shakeIntensity } = get();
    if (shakeIntensity > 0) {
      set({ shakeIntensity: Math.max(0, shakeIntensity - delta * 5) });
    }
  },
}));
