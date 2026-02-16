export type GameAction = "move_left" | "move_right" | "jump" | "slide";

/**
 * Maps a screen tap position to a game action based on which
 * third of the screen was tapped.
 *
 * Left third → move_left
 * Center third → jump
 * Right third → move_right
 */
export function getTapZone(
  x: number,
  _y: number,
  screenWidth: number,
  _screenHeight: number,
): GameAction {
  const third = screenWidth / 3;

  if (x < third) return "move_left";
  if (x < third * 2) return "jump";
  return "move_right";
}

const KEY_MAP: Record<string, GameAction> = {
  ArrowLeft: "move_left",
  ArrowRight: "move_right",
  ArrowUp: "jump",
  ArrowDown: "slide",
  a: "move_left",
  d: "move_right",
  w: "jump",
  s: "slide",
  " ": "jump",
};

/**
 * Maps a keyboard key string to a game action.
 * Returns null for unmapped keys.
 */
export function mapKeyToAction(key: string): GameAction | null {
  return KEY_MAP[key] ?? null;
}
