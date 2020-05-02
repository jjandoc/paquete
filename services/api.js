import addHours from 'date-fns/addHours';
import axios from 'axios';
import get from 'lodash/get';
import { toDate } from 'date-fns-tz';

const url =
  'https://spreadsheets.google.com/feeds/list/1D5JBmEg1teTHy43Gu0lJqlTJCp_T3lmHljAO5l_tEwk/1/public/full?alt=json';

// const baseURL = process.env.API_URL || '';
const headers = {
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
};

const api = axios.create({
  // baseURL,
  headers,
});

const durationToHours = (str) => {
  const [hoursStr, minutesStr] = str.split(':');
  const hours = parseInt(hoursStr, 10);
  const partialHour = parseInt(minutesStr, 10) / 60;
  return hours + partialHour;
};

const mapEntry = (entry) => {
  const title = get(entry, 'title.$t');
  const startTimeStr = get(entry, 'gsx$starttime.$t', null);
  if (!title || !startTimeStr) return null;

  const id = get(entry, 'id.$t', title);
  const link = get(entry, 'gsx$streamlink.$t', '');
  const category = get(entry, 'gsx$category.$t', '');
  const channel = get(entry, 'gsx$channelorhandle.$t', '');
  const description = get(entry, 'gsx$descriptionoptional.$t', '');
  const descriptionLink = get(entry, 'gsx$descriptionpagelinkoptional.$t', '');
  const donationLink = get(entry, 'gsx$donationpagelinkoptional.$t', '');
  const startTime = toDate(new Date(startTimeStr + ' EDT'), {
    timeZone: 'America/New_York',
  });
  const endTimeStr = get(entry, 'gsx$endtime.$t', null);
  const duration = durationToHours(
    get(entry, 'gsx$durationoptional.$t') || '1:00'
  );
  const endTime = endTimeStr
    ? toDate(new Date(endTimeStr + ' EDT'), { timeZone: 'America/New_York' })
    : addHours(startTime, duration);

  return {
    title,
    id,
    link,
    category,
    channel,
    description,
    descriptionLink,
    donationLink,
    startTime,
    endTime,
  };
};

export const fetchData = async (params) => {
  const { data } = await api.get(url);
  const entries = get(data, 'feed.entry', []);
  return entries.map(mapEntry).filter((item) => item);
};

export default {
  fetchData,
};
