import { SleepDailyDetail, SleepSummary } from './types/SleepSummary';

const num = (value: unknown): number | null => (typeof value === 'number' && isFinite(value) ? value : null);

const toMinutes = (secs: unknown) => {
  const value = num(secs);
  return value === null ? null : Math.round(value / 60);
};

const toIso = (secs: unknown) => {
  const value = num(secs);
  return value && value > 0 ? new Date(value * 1000).toISOString() : null;
};

const toDate = (day: unknown) => {
  if (day === undefined || day === null) return null;
  const str = `${day}`;
  return /^\d{8}$/.test(str) ? `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}` : str;
};

const hasSleep = (night: SleepDailyDetail) => num(night.sleepScore) !== null || (num(night.sleepTotalSecs) || 0) > 0;

// Picks the most recent processed night. The API returns newest first, but sort by wake time
// when available so we don't rely on ordering.
export const pickLatestNight = (nights: SleepDailyDetail[]): SleepDailyDetail | undefined => {
  const valid = nights.filter(hasSleep);
  if (valid.every((n) => num(n.lastOffBedTimeSecs) !== null)) {
    valid.sort((a, b) => (b.lastOffBedTimeSecs as number) - (a.lastOffBedTimeSecs as number));
  }
  return valid[0];
};

export const mapSleepSummary = (night: SleepDailyDetail): SleepSummary => {
  const onBed = num(night.firstOnBedTimeSecs);
  const offBed = num(night.lastOffBedTimeSecs);
  // inBedTotalSecs excludes breaks out of bed; fall back to first-on to last-off
  const inBedMinutes =
    toMinutes(night.inBedTotalSecs) ?? (onBed && offBed && offBed > onBed ? Math.round((offBed - onBed) / 60) : null);
  const snoreSecs = night.userSleepMetrics?.snoreDurationSecs ?? night.snoreDurationSecs;

  return {
    date: toDate(night.dayYYYYMMDD ?? night.sleepDayYYYYMMDD),
    score: num(night.sleepScore),
    efficiency: num(night.sleepEfficiencyPercentage),
    asleepMinutes: toMinutes(night.sleepTotalSecs),
    inBedMinutes,
    deepMinutes: toMinutes(night.deepTotalSecs),
    lightMinutes: toMinutes(night.lightTotalSecs),
    remMinutes: toMinutes(night.remTotalSecs),
    awakeMinutes: toMinutes(night.awakeTotalSecs),
    snoreMinutes: toMinutes(snoreSecs),
    timeToSleepMinutes: toMinutes(night.timeToSleepTotalSecs),
    wentToBed: toIso(onBed),
    fellAsleep: toIso(night.firstAsleepTimeSecs),
    gotUp: toIso(offBed),
    hrvRmssd: num(night.hrvRmssdMean),
    hrAvg: num(night.hrAvg),
    hrResting: num(night.hrResting),
    rrAvg: num(night.rrAvg),
    rrResting: num(night.rrResting),
  };
};
