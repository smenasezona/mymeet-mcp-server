import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { SearchMeetingsSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerSearchMeetings(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_search_meetings',
    'Search meetings by title keyword and/or date range. Returns matching meetings sorted by date.',
    SearchMeetingsSchema.shape,
    async ({ query, dateFrom, dateTo, status, page, perPage }) => {
      try {
        // Fetch all meetings (paginated) then filter client-side
        // MyMeet API doesn't have server-side search, so we filter locally
        const result = await client.listMeetings(page ?? 1, perPage ?? 50) as Record<string, unknown>;

        let meetings = Array.isArray(result) ? result : (result as any)?.meetings ?? [];

        if (query) {
          const lower = query.toLowerCase();
          meetings = meetings.filter((m: any) =>
            m.title?.toLowerCase().includes(lower) ||
            m.name?.toLowerCase().includes(lower),
          );
        }

        if (dateFrom) {
          const from = new Date(dateFrom).getTime();
          meetings = meetings.filter((m: any) => {
            const created = new Date(m.created_at ?? m.date ?? 0).getTime();
            return created >= from;
          });
        }

        if (dateTo) {
          const to = new Date(dateTo).getTime();
          meetings = meetings.filter((m: any) => {
            const created = new Date(m.created_at ?? m.date ?? 0).getTime();
            return created <= to;
          });
        }

        if (status) {
          meetings = meetings.filter((m: any) => m.status === status);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { total: meetings.length, meetings },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
