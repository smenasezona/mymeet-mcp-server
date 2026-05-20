# MyMeet MCP Server

Connect your AI assistant to your meetings. Record, search, analyze, and export meetings from Google Meet, Zoom, MS Teams, and 5 more platforms — right from Claude, Cursor, or any MCP-compatible client.

## Quick Start

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mymeet": {
      "command": "npx",
      "args": ["-y", "@mymeet/mcp-server"],
      "env": {
        "MYMEET_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add mymeet --transport stdio -e MYMEET_API_KEY=your-key -- npx -y @mymeet/mcp-server
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mymeet": {
      "command": "npx",
      "args": ["-y", "@mymeet/mcp-server"],
      "env": {
        "MYMEET_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## API Key

Get your API key at [app.mymeet.ai/settings](https://app.mymeet.ai/settings). Contact hello@mymeet.ai for B2B access.

## Available Tools

| Tool | Description |
|------|-------------|
| `mymeet_list_meetings` | List current user's meetings by default; use `scope: "workspace"` for all workspace meetings |
| `mymeet_get_meeting_status` | Check processing status (new/queued/processing/processed/failed) |
| `mymeet_get_meeting_report` | Get AI summary: key points, action items, decisions |
| `mymeet_get_transcript` | Get full transcript with speaker labels and timestamps |
| `mymeet_search_meetings` | Search current user's meetings across all pages by title, people, date range, status |
| `mymeet_download_meeting` | Download report as md/json (inline) or pdf/docx (URL) |
| `mymeet_record_meeting` | Schedule/start recording on 8 platforms with cron support |
| `mymeet_rename_meeting` | Rename a meeting |
| `mymeet_regenerate_template` | Re-analyze with a different template (11 available) |
| `mymeet_update_summary` | Edit AI-generated summary sections |
| `mymeet_delete_meeting` | Permanently delete a meeting |

## Templates

| Template | Use Case |
|----------|----------|
| `default-meeting` | Standard meeting summary |
| `sales-meeting` | Sales call: objections, next steps, signals |
| `sales-coaching` | Sales coaching feedback |
| `hr-interview` | Candidate evaluation |
| `research-interview` | Research insights and patterns |
| `team-sync` | Updates, blockers, decisions |
| `article` | SEO article from meeting content |
| `lecture-notes` | Key concepts and takeaways |
| `one-to-one` | Manager 1:1: feedback and goals |
| `protocol` | Formal protocol: agenda, decisions |
| `medicine` | Medical consultation notes |

## Supported Platforms

Google Meet, Zoom, Microsoft Teams, Yandex Telemost, SberJazz, TrueConf, KonturTalk, Jitsi

## Try It

```
"Show me my recent meetings"
"What was discussed in my last sales call?"
"Show all workspace meetings from last week"
"Record my Zoom meeting tomorrow at 2pm as a sales meeting"
"Re-analyze meeting X using the hr-interview template"
"Download the report for meeting Y as markdown"
```

### Meeting Scope

Read-only tools default to `scope: "mine"`, matching the current API key user's meetings. Workspace owners and admins can request all workspace meetings by passing `scope: "workspace"` explicitly.

To temporarily hide the search tool from MCP clients, set:

```bash
MYMEET_ENABLE_SEARCH_TOOL=false
```

## Remote Server (HTTP)

MyMeet hosts a remote MCP server — no local installation needed:

**URL:** `https://mcp.mymeet.ai/mcp`

### Claude Desktop

Settings → Customize → Connectors → Add custom connector:
- URL: `https://mcp.mymeet.ai/mcp`
- Header: `Authorization: Bearer YOUR_API_KEY`

### Claude Code

```bash
claude mcp add mymeet --transport http https://mcp.mymeet.ai/mcp \
  --header "Authorization: Bearer YOUR_API_KEY"
```

### Cursor (remote)

```json
{
  "mcpServers": {
    "mymeet": {
      "url": "https://mcp.mymeet.ai/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MYMEET_API_KEY"
      }
    }
  }
}
```

## Self-Hosted (Docker)

```bash
docker build -t mymeet-mcp .
docker run -p 3000:3000 mymeet-mcp
# Clients connect to http://localhost:3000/mcp with Authorization header
```

## Development

```bash
git clone https://github.com/mymeet-ai-first-company/mymeet-mcp-server.git
cd mymeet-mcp-server
npm install
npm run dev    # Run with tsx (hot reload)
npm run build  # Build for production
npm test       # Run tests
```

## License

MIT
