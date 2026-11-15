import { minutes } from '@utils/minutes';
import { RESUME_AFTER_WAKE, shouldFetchSleep } from './sleepFetchSchedule';

const frequency = minutes(15);
const gotUp = Date.parse('2026-11-15T13:14:00Z'); // 7:14am local
const retrievedAt = gotUp + minutes(75);

describe(shouldFetchSleep.name, () => {
  it('fetches on first run', () => {
    expect(shouldFetchSleep(undefined, Date.now(), frequency)).toBe(true);
  });

  describe('while waiting for a night (no wake time known)', () => {
    const state = { lastFetch: retrievedAt, lastGotUp: null };

    it('waits for the polling interval', () => {
      expect(shouldFetchSleep(state, retrievedAt + minutes(14), frequency)).toBe(false);
    });

    it('polls again once the interval has passed', () => {
      expect(shouldFetchSleep(state, retrievedAt + minutes(15), frequency)).toBe(true);
    });
  });

  describe('after a night has been retrieved', () => {
    const state = { lastFetch: retrievedAt, lastGotUp: gotUp };

    it('pauses for the rest of the day', () => {
      expect(shouldFetchSleep(state, retrievedAt + minutes(15), frequency)).toBe(false);
      expect(shouldFetchSleep(state, gotUp + RESUME_AFTER_WAKE - 1, frequency)).toBe(false);
    });

    it('resumes 22 hours after the wake time', () => {
      expect(RESUME_AFTER_WAKE).toBe(minutes(22 * 60));
      expect(shouldFetchSleep(state, gotUp + RESUME_AFTER_WAKE, frequency)).toBe(true);
    });

    it('keeps polling at the interval until the next night arrives', () => {
      const polling = { lastFetch: gotUp + RESUME_AFTER_WAKE, lastGotUp: gotUp };
      expect(shouldFetchSleep(polling, polling.lastFetch + minutes(10), frequency)).toBe(false);
      expect(shouldFetchSleep(polling, polling.lastFetch + minutes(15), frequency)).toBe(true);
    });
  });
});
