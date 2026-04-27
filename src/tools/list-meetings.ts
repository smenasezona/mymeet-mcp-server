import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { ListMeetingsSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerListMeetings(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_list_meetings',
    'List all meetings in workspace. Returns paginated results with title, date, status, template. Use this first to discover available meetings.',
    ListMeetingsSchema.shape,
    async ({ page, perPage }) => {
      try {
        const result = await client.listMeetings(page ?? 1, perPage ?? 20);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
