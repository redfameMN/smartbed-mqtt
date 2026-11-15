import { mapSleepSummary, pickLatestNight } from './mapSleepSummary';

const night = {
  dayYYYYMMDD: 20261114,
  sleepScore: 82,
  sleepEfficiencyPercentage: 91,
  sleepTotalSecs: 7 * 3600 + 30,
  deepTotalSecs: 3600,
  lightTotalSecs: 4 * 3600,
  remTotalSecs: 2 * 3600,
  awakeTotalSecs: 1800,
  firstOnBedTimeSecs: 1763178000,
  lastOffBedTimeSecs: 1763178000 + 8 * 3600,
  hrAvg: 58,
  userSleepMetrics: { snoreDurationSecs: 600 },
};

describe(mapSleepSummary.name, () => {
  it('maps a processed night', () => {
    expect(mapSleepSummary(night)).toEqual({
      date: '2026-11-14',
      score: 82,
      efficiency: 91,
      asleepMinutes: 421,
      inBedMinutes: 480,
      deepMinutes: 60,
      lightMinutes: 240,
      remMinutes: 120,
      awakeMinutes: 30,
      snoreMinutes: 10,
      timeToSleepMinutes: null,
      wentToBed: new Date(1763178000 * 1000).toISOString(),
      fellAsleep: null,
      gotUp: new Date((1763178000 + 8 * 3600) * 1000).toISOString(),
      hrvRmssd: null,
      hrAvg: 58,
      hrResting: null,
      rrAvg: null,
      rrResting: null,
    });
  });

  it('prefers inBedTotalSecs over first-on/last-off', () => {
    expect(mapSleepSummary({ ...night, inBedTotalSecs: 20100 }).inBedMinutes).toBe(335);
  });

  it('returns nulls for missing fields', () => {
    const result = mapSleepSummary({ sleepScore: 70 });
    expect(result.score).toBe(70);
    expect(result.inBedMinutes).toBeNull();
    expect(result.gotUp).toBeNull();
    expect(result.date).toBeNull();
  });
});

describe(pickLatestNight.name, () => {
  it('skips unprocessed nights and picks the latest wake time', () => {
    const older = { ...night, sleepScore: 60, lastOffBedTimeSecs: night.lastOffBedTimeSecs - 86400 };
    const pending = { sleepScore: null, sleepTotalSecs: 0, lastOffBedTimeSecs: night.lastOffBedTimeSecs + 86400 };
    expect(pickLatestNight([older, pending, night])).toBe(night);
  });

  it('returns undefined when nothing is processed', () => {
    expect(pickLatestNight([{ sleepScore: null }])).toBeUndefined();
  });
});
