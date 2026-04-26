/**
 * Countdown HUD formatter — pure helper used by every game's HUD.
 */
export function formatCountdown(remainingMs: number): string {
  const ms = Math.max(0, Math.floor(remainingMs));
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
