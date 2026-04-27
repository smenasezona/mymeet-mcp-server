import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { UpdateSummarySchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerUpdateSummary(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_update_summary',
    "Edit or update specific sections of a meeting's AI-generated summary.",
    UpdateSummarySchema.shape,
    async ({ meetingId, summary }) => {
      try {
        await client.updateSummary(meetingId, summary as Record<string, unknown>);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, meetingId, updated: Object.keys(summary) }),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
