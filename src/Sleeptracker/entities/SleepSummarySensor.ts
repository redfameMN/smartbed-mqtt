import { IDeviceData } from '@ha/IDeviceData';
import { Sensor } from '@ha/Sensor';
import { EntityConfig } from '@ha/base/Entity';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { Dictionary } from '@utils/Dictionary';
import { SleepSummary } from '../types/SleepSummary';

export type SleepSummarySensorConfig = EntityConfig & {
  valueField: keyof SleepSummary;
  discovery: Dictionary<any>;
  withAttributes?: boolean;
};

// One sensor per metric; all publish the same normalised night summary as JSON and pick their
// value via value_template. Only the score sensor exposes the full summary as attributes.
export class SleepSummarySensor extends Sensor<SleepSummary> {
  private valueField: keyof SleepSummary;
  private discovery: Dictionary<any>;
  private withAttributes: boolean;

  constructor(
    mqtt: IMQTTConnection,
    deviceData: IDeviceData,
    { valueField, discovery, withAttributes = false, ...config }: SleepSummarySensorConfig
  ) {
    super(mqtt, deviceData, config);
    this.valueField = valueField;
    this.discovery = discovery;
    this.withAttributes = withAttributes;
  }

  discoveryState() {
    return {
      ...super.discoveryState(),
      // null/missing renders as None, which HA's MQTT sensor treats as 'unknown'
      value_template: `{{ value_json.${this.valueField} | default(None) }}`,
      ...(this.withAttributes ? { json_attributes_topic: this.stateTopic } : {}),
      ...this.discovery,
    };
  }
}
