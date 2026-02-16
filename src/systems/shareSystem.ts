import { buildChallengeUrl } from "./challengeSystem";

export async function shareScore(
  score: number,
  seed: number,
  canvas?: HTMLCanvasElement | null
): Promise<void> {
  const challengeUrl = buildChallengeUrl(seed, score);

  // Try Web Share API first (native mobile sharing)
  if (navigator.share) {
    try {
      const shareData: ShareData = {
        title: `Stack Dash - ${score} points!`,
        text: `I scored ${score} in Stack Dash! Can you beat me?`,
        url: challengeUrl,
      };

      // Try to include screenshot if canvas is available
      if (canvas) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          const file = new File([blob], "stack-dash.png", { type: "image/png" });
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);
      return;
    } catch {
      // User cancelled or share failed, fall through to clipboard
    }
  }

  // Fallback: copy challenge URL to clipboard
  try {
    await navigator.clipboard.writeText(challengeUrl);
  } catch {
    // Clipboard API not available
  }
}

export function getChallengeUrl(seed: number, score: number): string {
  return buildChallengeUrl(seed, score);
}
