import { getRootOptions } from '@utils/options';

export type Type = 'tempur' | 'beautyrest' | 'serta';

export interface Credentials {
  email: string;
  password: string;
  type?: Type;
}

interface OptionsJson {
  sleeptrackerRefreshFrequency: number;
  sleeptrackerSleepRefreshFrequency?: number;
  sleeptrackerCredentials: Credentials[];
}

const options: OptionsJson = getRootOptions();

export const getUsers = () => {
  const credentials = options.sleeptrackerCredentials;
  if (Array.isArray(credentials)) {
    return credentials;
  }
  return [credentials];
};
export const getRefreshFrequency = () => options.sleeptrackerRefreshFrequency;
// minutes between sleep summary polls while waiting for the next night (polling pauses once a
// night is retrieved, until 22h after its wake time - see sleepFetchSchedule); 0 disables sleep sensors
export const getSleepRefreshFrequency = () => options.sleeptrackerSleepRefreshFrequency ?? 15;
