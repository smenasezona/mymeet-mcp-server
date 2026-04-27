import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { MeetingIdSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerGetMeetingReport(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_get_meeting_report',
    'Get AI-generated summary for a processed meeting: key points, action items, decisions. Does NOT include full transcript — use mymeet_get_transcript for that.',
    MeetingIdSchema.shape,
    async ({ meetingId }) => {
      try {
        const result = await client.getMeetingReport(meetingId) as Record<string, unknown>;

        // Strip transcript to avoid 25K token limit — use mymeet_get_transcript instead
        if (result && typeof result === 'object') {
          const { transcript, ...reportWithoutTranscript } = result;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(reportWithoutTranscript, null, 2),
              },
            ],
          };
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
