import { logError } from '@utils/logger';
import axios from 'axios';
import { Credentials } from '../options';
import { SleepDailyDetail } from '../types/SleepSummary';
import { getAuthHeader } from './getAuthHeader';
import defaultHeaders from './shared/defaultHeaders';
import { buildDefaultPayload } from './shared/defaultPayload';
import { urls } from './shared/urls';

type Response = {
  statusCode?: number;
  statusMessage?: string;
  summary?: {
    currentRecordingStatus?: unknown;
    sleepsDailySummary?: { sleepSummaryDailyDetails?: SleepDailyDetail[] };
  };
};

const yyyymmdd = (date: Date) => date.toISOString().substring(0, 10).replace(/-/g, '');
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// Fetches daily sleep summaries for the account behind `credentials` (the token decides whose
// sleep is returned, so on a split bed each side needs its own account).
export const getSleepSummary = async (credentials: Credentials, daysBack = 3) => {
  const authHeader = await getAuthHeader(credentials);
  if (!authHeader) return null;

  const { appHost, webuiUrl } = urls(credentials);
  const now = new Date();
  try {
    const response = await axios.request<Response>({
      method: 'POST',
      url: webuiUrl,
      headers: {
        ...defaultHeaders,
        Host: appHost,
        Authorization: authHeader,
      },
      data: {
        ...buildDefaultPayload('sleepSummary', credentials),
        version: 'v2',
        command: 'fetch',
        dataClass: 'activities',
        resultLimitSize: 10,
        returnEmptySummaryFlag: false,
        includeSleepsDailySummary: true,
        // pad by a day either side so the server's timezone doesn't drop last night
        sleepsDailyStartDayYYYYMMDD: yyyymmdd(addDays(now, -daysBack)),
        sleepsDailyEndDayYYYYMMDD: yyyymmdd(addDays(now, 1)),
        sleepZSleepsSummaries: true,
        currentRecordingStatus: true,
        newestToOldest: true,
      },
    });
    const { statusCode, statusMessage, summary } = response.data;
    // webui answers with HTTP-style 200 on success (the fpcsiot endpoints use 0)
    if (statusCode !== undefined && statusCode !== 0 && statusCode !== 200) {
      logError('[Sleeptracker] Sleep summary request failed', statusCode, statusMessage);
      return null;
    }
    return summary?.sleepsDailySummary?.sleepSummaryDailyDetails || [];
  } catch (err) {
    logError(err);
    return null;
  }
};
