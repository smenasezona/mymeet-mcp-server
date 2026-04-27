import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { RenameMeetingSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerRenameMeeting(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_rename_meeting',
    'Rename a meeting to a more descriptive title.',
    RenameMeetingSchema.shape,
    async ({ meetingId, name }) => {
      try {
        await client.renameMeeting(meetingId, name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, meetingId, newName: name }),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
