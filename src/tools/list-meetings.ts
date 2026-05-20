import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { ListMeetingsSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerListMeetings(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_list_meetings',
    'List meetings visible to the current user. Defaults to scope="mine" for personal meeting requests. Use scope="workspace" only when the user explicitly asks for all workspace meetings. Returns paginated results with title, date, status, template.',
    ListMeetingsSchema.shape,
    async ({ scope, page, perPage }) => {
      try {
        const result = await client.listMeetings(page ?? 1, perPage ?? 20, scope ?? 'mine');
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
