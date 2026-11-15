import { minutes } from '@utils/minutes';

// After a night has been retrieved, don't look for the next one until this long after the person
// got up. Waking up to ~2 hours earlier than usual still gets picked up promptly; sleeping in just
// means a few extra polls.
export const RESUME_AFTER_WAKE = minutes(22 * 60);

export type SleepFetchState = {
  // when the last fetch was attempted (ms since epoch)
  lastFetch: number;
  // when the latest retrieved night ended (ms since epoch), if known
  lastGotUp: number | null;
};

// Poll every `frequency` ms until a night has been retrieved, then pause until RESUME_AFTER_WAKE
// after that night ended. Without a known wake time, keep polling at `frequency`.
export const shouldFetchSleep = (state: SleepFetchState | undefined, now: number, frequency: number) => {
  if (!state) return true;
  if (now - state.lastFetch < frequency) return false;
  if (state.lastGotUp !== null && now < state.lastGotUp + RESUME_AFTER_WAKE) return false;
  return true;
};
