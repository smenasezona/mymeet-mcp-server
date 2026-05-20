import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { searchMeetingsAcrossPages } from '../search.js';
import { SearchMeetingsSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerSearchMeetings(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_search_meetings',
    'Search meetings across all pages by title, people, status, and/or date range. Defaults to scope="mine" for personal meeting requests. Use scope="workspace" only when the user explicitly asks for all workspace meetings.',
    SearchMeetingsSchema.shape,
    async ({ scope, query, dateFrom, dateTo, status, page, perPage }) => {
      try {
        const result = await searchMeetingsAcrossPages(client, {
          scope: scope ?? 'mine',
          query,
          dateFrom,
          dateTo,
          status,
          page: page ?? 1,
          perPage: perPage ?? 50,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
