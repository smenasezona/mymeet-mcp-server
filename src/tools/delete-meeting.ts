import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { DeleteMeetingSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerDeleteMeeting(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_delete_meeting',
    'Permanently delete a meeting and all its data. This action cannot be undone.',
    DeleteMeetingSchema.shape,
    async ({ meetingId }) => {
      try {
        await client.deleteMeeting(meetingId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                meetingId,
                message: 'Meeting permanently deleted.',
              }),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
