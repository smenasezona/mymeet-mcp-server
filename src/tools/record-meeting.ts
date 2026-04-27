import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MyMeetApiClient } from '../client.js';
import { RecordMeetingSchema } from '../types.js';
import { formatToolError } from '../errors.js';

export function registerRecordMeeting(server: McpServer, client: MyMeetApiClient): void {
  server.tool(
    'mymeet_record_meeting',
    'Schedule or start recording an online meeting. Supports 8 platforms: Google Meet, Zoom, MS Teams, Yandex Telemost, SberJazz, TrueConf, KonturTalk, Jitsi. Can schedule recurring recordings via cron expression.',
    RecordMeetingSchema.shape,
    async (params) => {
      try {
        const result = await client.recordMeeting(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return formatToolError(error);
      }
    },
  );
}
