import { describe, expect, it, vi } from 'vitest';
import {
  filterMeetings,
  searchMeetingsAcrossPages,
  type MeetingRecord,
} from '../src/search.js';

describe('searchMeetingsAcrossPages', () => {
  it('finds a meeting on a later backend page and defaults scope to mine', async () => {
    const page1 = makeMeetings(50, 'page-1');
    const page2 = makeMeetings(50, 'page-2');
    const page3 = [
      ...makeMeetings(49, 'page-3'),
      {
        id: 'target',
        title: 'Слава / Владимир',
        date: '2026-05-12T14:00:00.000Z',
        status: 'new',
      },
    ];
    const page4 = makeMeetings(5, 'page-4');
    const pages = [page1, page2, page3, page4];
    const client = {
      listMeetings: vi.fn(async (page: number) => ({
        meetings: pages[page - 1] ?? [],
        total: 155,
      })),
    };

    const result = await searchMeetingsAcrossPages(client, {
      query: 'Слава / Владимир',
    });

    expect(client.listMeetings).toHaveBeenCalledTimes(4);
    expect(client.listMeetings).toHaveBeenNthCalledWith(1, 1, 50, 'mine');
    expect(client.listMeetings).toHaveBeenNthCalledWith(3, 3, 50, 'mine');
    expect(result).toMatchObject({
      total: 1,
      returned: 1,
      page: 1,
      perPage: 50,
      scope: 'mine',
      truncated: false,
    });
    expect(result.meetings[0].id).toBe('target');
  });

  it('passes explicit workspace scope while scanning pages', async () => {
    const client = {
      listMeetings: vi.fn(async () => ({
        meetings: [{ id: 'target', title: 'Oracle Weekly Meet' }],
        total: 1,
      })),
    };

    await searchMeetingsAcrossPages(client, {
      query: 'oracle',
      scope: 'workspace',
    });

    expect(client.listMeetings).toHaveBeenCalledWith(1, 50, 'workspace');
  });

  it('reads the backend followups array shape', async () => {
    const client = {
      listMeetings: vi.fn(async () => ({
        followups: [{ id: 'target', name: 'Слава / Владимир' }],
        total: 1,
      })),
    };

    const result = await searchMeetingsAcrossPages(client, {
      query: 'Владимир',
    });

    expect(result.total).toBe(1);
    expect(result.meetings[0].id).toBe('target');
  });

  it('matches people fields in authors, speakers, and participants', async () => {
    const meetings: MeetingRecord[] = [
      {
        id: 'authors',
        title: 'Daily',
        authors: [{ login: 'vsmirnov@fintechiq.ru', displayName: 'Slava Smirnov' }],
      },
      {
        id: 'speakers',
        title: 'Planning',
        speakers: [{ name: 'Vladimir Petrov' }],
      },
      {
        id: 'participants',
        title: 'Review',
        participants: [{ full_name: 'Anna Ivanova' }],
      },
    ];

    expect(filterMeetings(meetings, { query: 'fintechiq' }).map((m) => m.id)).toEqual(['authors']);
    expect(filterMeetings(meetings, { query: 'vladimir' }).map((m) => m.id)).toEqual(['speakers']);
    expect(filterMeetings(meetings, { query: 'anna ivanova' }).map((m) => m.id)).toEqual(['participants']);
  });

  it('treats a date-only dateTo as inclusive through the end of that day', () => {
    const meetings: MeetingRecord[] = [
      {
        id: 'late-same-day',
        title: 'Late same day',
        date: '2026-05-15T23:59:59.999Z',
      },
      {
        id: 'next-day',
        title: 'Next day',
        date: '2026-05-16T00:00:00.000Z',
      },
    ];

    expect(filterMeetings(meetings, { dateTo: '2026-05-15' }).map((m) => m.id)).toEqual([
      'late-same-day',
    ]);
  });

  it('paginates after filtering and reports truncated result pages', async () => {
    const client = {
      listMeetings: vi.fn(async () => ({
        meetings: [
          { id: '1', title: 'Weekly sync' },
          { id: '2', title: 'Weekly review' },
          { id: '3', title: 'Weekly planning' },
        ],
        total: 3,
      })),
    };

    const result = await searchMeetingsAcrossPages(client, {
      query: 'weekly',
      page: 1,
      perPage: 2,
    });

    expect(result.total).toBe(3);
    expect(result.returned).toBe(2);
    expect(result.truncated).toBe(true);
    expect(result.meetings.map((meeting) => meeting.id)).toEqual(['1', '2']);
  });
});

function makeMeetings(count: number, prefix: string): MeetingRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} meeting ${index}`,
    date: '2026-05-15T10:00:00.000Z',
    status: 'new',
  }));
}
