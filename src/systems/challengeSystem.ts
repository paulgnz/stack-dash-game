export function encodeSeed(seed: number): string {
  return seed.toString(36);
}

export function decodeSeed(encoded: string): number {
  return parseInt(encoded, 36);
}

export function buildChallengeUrl(seed: number, score: number): string {
  const base = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "https://stackdash.game";
  return `${base}?c=${encodeSeed(seed)}&s=${score}`;
}

export function parseChallengeUrl(url: string): { seed: number; score: number } | null {
  try {
    const u = new URL(url);
    const c = u.searchParams.get("c");
    const s = u.searchParams.get("s");
    if (!c || !s) return null;
    return { seed: decodeSeed(c), score: parseInt(s, 10) };
  } catch {
    return null;
  }
}
