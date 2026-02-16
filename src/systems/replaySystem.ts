export interface ReplayFrame {
  time: number;
  playerPos: [number, number, number];
  blocks: Array<{
    id: number;
    pos: [number, number, number];
    rot: [number, number, number, number];
  }>;
  score: number;
}

export class ReplayBuffer {
  private frames: ReplayFrame[] = [];
  private maxFrames: number;

  constructor(maxFrames: number = 300) {
    this.maxFrames = maxFrames;
  }

  push(frame: ReplayFrame) {
    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) {
      this.frames.shift();
    }
  }

  getFrames(): ReplayFrame[] {
    return [...this.frames];
  }

  getHighlightWindow(windowSize: number): ReplayFrame[] {
    if (this.frames.length === 0) return [];

    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < this.frames.length; i++) {
      if (this.frames[i].score > bestScore) {
        bestScore = this.frames[i].score;
        bestIdx = i;
      }
    }

    const start = Math.max(0, Math.min(bestIdx, this.frames.length - windowSize));
    const end = Math.min(this.frames.length, start + windowSize);
    return this.frames.slice(start, end);
  }

  clear() {
    this.frames = [];
  }
}
