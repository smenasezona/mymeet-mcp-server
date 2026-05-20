import { afterEach, describe, expect, it } from 'vitest';
import { createServer, isSearchToolEnabled } from '../src/server.js';

describe('isSearchToolEnabled', () => {
  afterEach(() => {
    delete process.env.MYMEET_ENABLE_SEARCH_TOOL;
  });

  it('keeps search enabled by default', () => {
    expect(isSearchToolEnabled(undefined)).toBe(true);
  });

  it('disables search for false-like environment values', () => {
    expect(isSearchToolEnabled('false')).toBe(false);
    expect(isSearchToolEnabled('FALSE')).toBe(false);
    expect(isSearchToolEnabled('0')).toBe(false);
  });

  it('keeps search enabled for other values', () => {
    expect(isSearchToolEnabled('true')).toBe(true);
    expect(isSearchToolEnabled('1')).toBe(true);
  });

  it('does not register mymeet_search_meetings when disabled', () => {
    process.env.MYMEET_ENABLE_SEARCH_TOOL = 'false';

    const server = createServer('test-api-key') as any;

    expect(Object.keys(server._registeredTools)).not.toContain('mymeet_search_meetings');
    expect(Object.keys(server._registeredTools)).toContain('mymeet_list_meetings');
  });
});
