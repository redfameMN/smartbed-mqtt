// Raw daily summary record from actrack/webui (summary.sleepsDailySummary.sleepSummaryDailyDetails[]).
// Field names are taken from observed responses; everything is optional because the API omits
// fields for nights that have not been processed yet.
export type SleepDailyDetail = {
  dayYYYYMMDD?: number | string;
  sleepDayYYYYMMDD?: number | string;
  sleepScore?: number | null;
  sleepEfficiencyPercentage?: number | null;
  sleepTotalSecs?: number | null;
  deepTotalSecs?: number | null;
  lightTotalSecs?: number | null;
  remTotalSecs?: number | null;
  awakeTotalSecs?: number | null;
  inBedTotalSecs?: number | null;
  timeToSleepTotalSecs?: number | null;
  firstAsleepTimeSecs?: number | null;
  hrvRmssdMean?: number | null;
  firstOnBedTimeSecs?: number | null;
  lastOffBedTimeSecs?: number | null;
  hrAvg?: number | null;
  hrResting?: number | null;
  rrAvg?: number | null;
  rrResting?: number | null;
  snoreDurationSecs?: number | null;
  userSleepMetrics?: { snoreDurationSecs?: number | null };
};

// Normalised summary of a single night, published as the JSON state of each sleep sensor.
export type SleepSummary = {
  date: string | null;
  score: number | null;
  efficiency: number | null;
  asleepMinutes: number | null;
  inBedMinutes: number | null;
  deepMinutes: number | null;
  lightMinutes: number | null;
  remMinutes: number | null;
  awakeMinutes: number | null;
  snoreMinutes: number | null;
  timeToSleepMinutes: number | null;
  wentToBed: string | null;
  fellAsleep: string | null;
  gotUp: string | null;
  hrvRmssd: number | null;
  hrAvg: number | null;
  hrResting: number | null;
  rrAvg: number | null;
  rrResting: number | null;
};
