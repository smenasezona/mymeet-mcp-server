import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { RegenerateTemplateSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerRegenerateTemplate(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_regenerate_template',
    'Re-analyze a processed meeting using a different template. Available templates: default-meeting, sales-meeting, sales-coaching, hr-interview, research-interview, team-sync, article, lecture-notes, one-to-one, protocol, medicine.',
    RegenerateTemplateSchema.shape,
    async ({ meetingId, template }) => {
      try {
        const result = await client.regenerateTemplate(meetingId, template);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                meetingId,
                newTemplate: template,
                note: 'Re-analysis started. Use mymeet_get_meeting_status to check when processing is complete.',
                ...(result && typeof result === 'object' ? result : {}),
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
