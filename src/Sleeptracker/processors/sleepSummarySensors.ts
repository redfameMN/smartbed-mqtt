import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { Dictionary } from '@utils/Dictionary';
import { getSideNameFunc } from '@utils/getSideNameFunc';
import { logInfo } from '@utils/logger';
import { minutes } from '@utils/minutes';
import { buildEntityConfig } from '../buildEntityConfig';
import { SleepSummarySensor, SleepSummarySensorConfig } from '../entities/SleepSummarySensor';
import { mapSleepSummary, pickLatestNight } from '../mapSleepSummary';
import { getSleepRefreshFrequency } from '../options';
import { getSleepSummary } from '../requests/getSleepSummary';
import { SleepFetchState, shouldFetchSleep } from '../sleepFetchSchedule';
import { Bed } from '../types/Bed';

const duration = { device_class: 'duration', unit_of_measurement: 'min', state_class: 'measurement' };

type SensorDefinition = Omit<SleepSummarySensorConfig, 'description'> & { name: string };

const definitions: SensorDefinition[] = [
  {
    name: 'Sleep Score',
    valueField: 'score',
    withAttributes: true,
    discovery: { state_class: 'measurement', icon: 'mdi:sleep' },
  },
  { name: 'Time Asleep', valueField: 'asleepMinutes', discovery: { ...duration, icon: 'mdi:power-sleep' } },
  { name: 'Time In Bed', valueField: 'inBedMinutes', discovery: { ...duration, icon: 'mdi:bed-clock' } },
  { name: 'Deep Sleep', valueField: 'deepMinutes', discovery: { ...duration, icon: 'mdi:sleep' } },
  { name: 'Light Sleep', valueField: 'lightMinutes', discovery: { ...duration, icon: 'mdi:sleep' } },
  { name: 'REM Sleep', valueField: 'remMinutes', discovery: { ...duration, icon: 'mdi:eye-outline' } },
  { name: 'Awake Time', valueField: 'awakeMinutes', discovery: { ...duration, icon: 'mdi:eye' } },
  {
    name: 'Sleep Efficiency',
    valueField: 'efficiency',
    discovery: { unit_of_measurement: '%', state_class: 'measurement', icon: 'mdi:percent' },
  },
  { name: 'Last Sleep', valueField: 'gotUp', discovery: { device_class: 'timestamp' } },
];

const sensorsBySide: Dictionary<SleepSummarySensor[]> = {};
const fetchStateByUser: Dictionary<SleepFetchState> = {};

export const processSleepSummarySensors = async (mqtt: IMQTTConnection, bed: Bed) => {
  const frequency = getSleepRefreshFrequency();
  if (frequency <= 0) return;

  const sensors = bed.sensors.filter((s) => !!s);
  const sideNameFunc = getSideNameFunc(sensors, (s) => s.unitNumber);

  for (const sensor of sensors) {
    const { user, unitNumber: side } = sensor;
    if (!user) continue; // no configured account for this side

    const now = Date.now();
    const fetchState = fetchStateByUser[user.email];
    if (!shouldFetchSleep(fetchState, now, minutes(frequency))) continue;
    const lastGotUp = fetchState?.lastGotUp ?? null;
    fetchStateByUser[user.email] = { lastFetch: now, lastGotUp };

    const nights = await getSleepSummary(user);
    if (!nights) continue; // failed; retried after `frequency` minutes
    const night = pickLatestNight(nights);
    if (!night) {
      logInfo('[Sleeptracker] No processed nights yet for side', side);
      continue;
    }
    const gotUp = typeof night.lastOffBedTimeSecs === 'number' ? night.lastOffBedTimeSecs * 1000 : null;
    if (gotUp !== null && gotUp !== lastGotUp) {
      logInfo('[Sleeptracker] Retrieved sleep summary for side', side, 'night of', night.dayYYYYMMDD);
    }
    fetchStateByUser[user.email].lastGotUp = gotUp;

    const key = `${bed.processorId}.${side}`;
    const sideName = sideNameFunc(sensor);
    const entities = (sensorsBySide[key] ||= definitions.map(
      ({ name, ...config }) =>
        new SleepSummarySensor(mqtt, bed.deviceData, { ...buildEntityConfig(name, sideName), ...config })
    ));
    const summary = mapSleepSummary(night);
    entities.forEach((entity) => entity.setState(summary));
  }
};
