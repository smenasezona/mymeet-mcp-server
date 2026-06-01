import { describe, expect, it, vi, afterEach } from 'vitest';
import { MyMeetApiClient } from '../src/client.js';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('MyMeetApiClient.listMeetings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts the public one-based first page to backend page zero and defaults scope to mine', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ meetings: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new MyMeetApiClient('test-api-key', 'https://backend.example');
    await client.listMeetings();

    const [calledUrl, init] = fetchMock.mock.calls[0];
    const url = new URL(calledUrl as string);
    expect(url.pathname).toBe('/api/workspaces/active/user-meetings');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('perPage')).toBe('20');
    // key travels in the X-API-KEY header, never in the URL
    expect(url.searchParams.has('api_key')).toBe(false);
    expect((init?.headers as Record<string, string>)['X-API-KEY']).toBe('test-api-key');
  });

  it('passes explicit workspace scope and converts later pages to backend zero-based pages', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ meetings: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new MyMeetApiClient('test-api-key', 'https://backend.example');
    await client.listMeetings(2, 50, 'workspace');

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe('/api/workspaces/active/all-meetings');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('perPage')).toBe('50');
  });
});
