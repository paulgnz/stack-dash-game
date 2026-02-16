import { create } from "zustand";
import { ReplayBuffer } from "../systems/replaySystem";
import type { ReplayFrame } from "../systems/replaySystem";

interface ReplayState {
  buffer: ReplayBuffer;
  highlightFrames: ReplayFrame[];
  recordFrame: (frame: ReplayFrame) => void;
  captureHighlight: () => void;
  reset: () => void;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  buffer: new ReplayBuffer(300), // ~5 seconds at 60fps
  highlightFrames: [],

  recordFrame: (frame) => {
    get().buffer.push(frame);
  },

  captureHighlight: () => {
    set({ highlightFrames: get().buffer.getHighlightWindow(180) }); // ~3 seconds
  },

  reset: () => {
    get().buffer.clear();
    set({ highlightFrames: [] });
  },
}));
