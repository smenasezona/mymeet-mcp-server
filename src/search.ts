import type { MeetingScope, MeetingStatus } from './types.js';

const SEARCH_SCAN_PAGE_SIZE = 50;
const MAX_SEARCH_SCAN_PAGES = 100;

export type MeetingRecord = Record<string, unknown>;

export interface ListMeetingsClient {
  listMeetings(page?: number, perPage?: number, scope?: MeetingScope): Promise<unknown>;
}

export interface SearchMeetingsOptions {
  scope?: MeetingScope;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: MeetingStatus;
  page?: number;
  perPage?: number;
}

export interface SearchMeetingsResult {
  total: number;
  returned: number;
  page: number;
  perPage: number;
  scope: MeetingScope;
  truncated: boolean;
  meetings: MeetingRecord[];
}

interface MeetingsPage {
  meetings: MeetingRecord[];
  total?: number;
}

export async function searchMeetingsAcrossPages(
  client: ListMeetingsClient,
  options: SearchMeetingsOptions,
): Promise<SearchMeetingsResult> {
  const scope = options.scope ?? 'mine';
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 50;

  const allMeetings: MeetingRecord[] = [];
  let scanTruncated = false;
  let expectedTotal: number | undefined;

  for (let currentPage = 1; currentPage <= MAX_SEARCH_SCAN_PAGES; currentPage += 1) {
    const result = await client.listMeetings(currentPage, SEARCH_SCAN_PAGE_SIZE, scope);
    const { meetings, total } = extractMeetingsPage(result);

    if (typeof total === 'number') {
      expectedTotal = total;
    }

    allMeetings.push(...meetings);

    if (meetings.length === 0) break;
    if (typeof expectedTotal === 'number' && allMeetings.length >= expectedTotal) break;
    if (meetings.length < SEARCH_SCAN_PAGE_SIZE) break;

    if (currentPage === MAX_SEARCH_SCAN_PAGES) {
      scanTruncated = true;
    }
  }

  const filtered = filterMeetings(allMeetings, options);
  const paginated = paginateMeetings(filtered, page, perPage);

  return {
    ...paginated,
    scope,
    truncated: paginated.truncated || scanTruncated,
  };
}

export function filterMeetings(
  meetings: MeetingRecord[],
  options: Pick<SearchMeetingsOptions, 'query' | 'dateFrom' | 'dateTo' | 'status'>,
): MeetingRecord[] {
  return meetings.filter((meeting) => (
    matchesQuery(meeting, options.query) &&
    matchesDateRange(meeting, options.dateFrom, options.dateTo) &&
    matchesStatus(meeting, options.status)
  ));
}

export function paginateMeetings(
  meetings: MeetingRecord[],
  page = 1,
  perPage = 50,
): Omit<SearchMeetingsResult, 'scope'> {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const start = (safePage - 1) * safePerPage;
  const pagedMeetings = meetings.slice(start, start + safePerPage);

  return {
    total: meetings.length,
    returned: pagedMeetings.length,
    page: safePage,
    perPage: safePerPage,
    truncated: start + pagedMeetings.length < meetings.length,
    meetings: pagedMeetings,
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

function extractMeetingsPage(result: unknown): MeetingsPage {
  if (Array.isArray(result)) {
    return { meetings: result.filter(isMeetingRecord) };
  }

  if (!isMeetingRecord(result)) {
    return { meetings: [] };
  }

  const meetings = Array.isArray(result.meetings)
    ? result.meetings.filter(isMeetingRecord)
    : Array.isArray(result.followups)
      ? result.followups.filter(isMeetingRecord)
    : [];
  const total = typeof result.total === 'number' ? result.total : undefined;

  return { meetings, total };
}

function matchesQuery(meeting: MeetingRecord, query?: string): boolean {
  const normalizedQuery = normalizeSearchText(query ?? '');
  if (!normalizedQuery) return true;

  const haystack = collectMeetingSearchText(meeting);
  if (haystack.includes(normalizedQuery)) return true;

  const tokens = normalizedQuery
    .split(/[\s/,;:|()[\]{}]+/)
    .filter(Boolean);

  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

function collectMeetingSearchText(meeting: MeetingRecord): string {
  const values = [
    meeting.title,
    meeting.name,
    meeting.entityName,
    meeting.authors,
    meeting.speakers,
    meeting.participants,
  ];

  return normalizeSearchText(values.flatMap(collectStringLeaves).join(' '));
}

function collectStringLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectStringLeaves);

  if (isMeetingRecord(value)) {
    return [
      value.name,
      value.displayName,
      value.display_name,
      value.fullName,
      value.full_name,
      value.email,
      value.login,
      value.title,
    ].flatMap(collectStringLeaves);
  }

  return [];
}

function matchesDateRange(meeting: MeetingRecord, dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom && !dateTo) return true;

  const meetingTime = getMeetingTime(meeting);
  if (meetingTime === undefined) return false;

  const from = dateFrom ? parseDateBoundary(dateFrom, 'start') : undefined;
  const to = dateTo ? parseDateBoundary(dateTo, 'end') : undefined;

  if (from !== undefined && meetingTime < from) return false;
  if (to !== undefined && meetingTime > to) return false;

  return true;
}

function getMeetingTime(meeting: MeetingRecord): number | undefined {
  const value = meeting.date ?? meeting.created_at ?? meeting.createdAt;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

function parseDateBoundary(value: string, boundary: 'start' | 'end'): number | undefined {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const normalized = dateOnly && boundary === 'end'
    ? `${value}T23:59:59.999Z`
    : value;
  const time = new Date(normalized).getTime();

  return Number.isNaN(time) ? undefined : time;
}

function matchesStatus(meeting: MeetingRecord, status?: MeetingStatus): boolean {
  return status ? meeting.status === status : true;
}

function isMeetingRecord(value: unknown): value is MeetingRecord {
  return typeof value === 'object' && value !== null;
}
