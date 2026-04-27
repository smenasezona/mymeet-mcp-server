import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { DownloadMeetingSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerDownloadMeeting(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_download_meeting',
    'Get a download URL for a meeting report. For md and json formats, returns content directly. For pdf and docx, returns a download URL (binary formats cannot be returned inline).',
    DownloadMeetingSchema.shape,
    async ({ meetingId, format }) => {
      try {
        const result = await client.downloadMeeting(meetingId, format);

        // For text formats (md, json) — return content directly
        if (format === 'md' || format === 'json') {
          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        // For binary formats (pdf, docx) — return download URL
        // The API returns the file, but we can't pass binary through MCP
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                format,
                meetingId,
                downloadUrl: `https://backend.mymeet.ai/api/storage/download?meeting_id=${meetingId}&format=${format}`,
                note: `Binary format (${format}) cannot be returned inline. Use the download URL above.`,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
