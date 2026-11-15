import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { mocked, testDevice } from '@utils/testHelpers';
import { mock } from 'jest-mock-extended';
import { SleepSummary } from '../types/SleepSummary';
import { SleepSummarySensor } from './SleepSummarySensor';

const mqtt: IMQTTConnection = mock<IMQTTConnection>();
const buildSubject = () =>
  new SleepSummarySensor(mqtt, testDevice, {
    description: 'Sleep Score',
    valueField: 'score',
    withAttributes: true,
    discovery: { state_class: 'measurement' },
  });

const summary = { date: '2026-11-15', score: 63, asleepMinutes: 306 } as SleepSummary;
const stateTopic = 'device_topic/sleep_score/state';
const statusTopic = 'device_topic/sleep_score/status';

describe(SleepSummarySensor.name, () => {
  beforeAll(() => jest.useFakeTimers());

  beforeEach(jest.resetAllMocks);

  it('publishes discovery with value template and attributes topic', () => {
    buildSubject();
    jest.runAllTimers();
    expect(mqtt.publish).toBeCalledWith(
      'homeassistant/sensor/device_topic_sleep_score/config',
      expect.objectContaining({
        state_topic: stateTopic,
        value_template: '{{ value_json.score | default(None) }}',
        json_attributes_topic: stateTopic,
        state_class: 'measurement',
      })
    );
  });

  it('replays state and availability after the initial discovery', () => {
    buildSubject().setState(summary);
    jest.runAllTimers();
    const stateCalls = mocked(mqtt.publish).mock.calls.filter(([topic]) => topic === stateTopic);
    const onlineCalls = mocked(mqtt.publish).mock.calls.filter(
      ([topic, message]) => topic === statusTopic && message === 'online'
    );
    expect(stateCalls).toEqual([
      [stateTopic, summary],
      [stateTopic, summary],
    ]);
    expect(onlineCalls).toHaveLength(2);
  });

  it('replays state when Home Assistant comes back online', async () => {
    let onStatus: ((message: string) => Promise<void>) | null = null;
    mocked(mqtt.on).mockImplementation((topic, func) => {
      if (topic === 'homeassistant/status') onStatus = func;
    });
    buildSubject().setState(summary);
    jest.runAllTimers();
    mocked(mqtt.publish).mockClear();

    await onStatus!('online');
    jest.runAllTimers();

    expect(mqtt.publish).toBeCalledWith(stateTopic, summary);
    expect(mqtt.publish).toBeCalledWith(statusTopic, 'online');
  });

  it('does not publish state before any summary is known', () => {
    buildSubject();
    jest.runAllTimers();
    expect(mqtt.publish).not.toBeCalledWith(stateTopic, expect.anything());
    expect(mqtt.publish).not.toBeCalledWith(statusTopic, 'online');
  });
});
