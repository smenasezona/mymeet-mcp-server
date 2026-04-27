# MyMeet MCP Server — Tool Reference

Detailed documentation for all 11 tools with parameters, examples, and edge cases.

---

## Read-Only Tools

### mymeet_list_meetings

List all meetings in workspace with pagination.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `perPage` | number | No | 20 | Results per page (max: 100) |

**Example prompt:** "Show me my recent meetings"

**Example response:**
```json
{
  "meetings": [
    {
      "meeting_id": "abc-123",
      "title": "Weekly Sales Sync",
      "status": "processed",
      "template_name": "sales-meeting",
      "created_at": "2024-03-15T14:00:00Z",
      "source": "gmeet"
    }
  ],
  "page": 1,
  "total": 42
}
```

**Edge cases:**
- Empty workspace: returns `{ meetings: [], total: 0 }`
- Invalid page: returns empty array

---

### mymeet_get_meeting_status

Check processing status of a specific meeting.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |

**Statuses:** `new` → `queued` → `processing` → `processed` / `failed`

**Example prompt:** "Is my meeting from today done processing?"

**When to use:** After `mymeet_record_meeting` or uploading a file, poll this until status is `processed`.

**Edge cases:**
- Meeting not found: returns `NotFoundError` with suggestion to use `mymeet_list_meetings`
- Meeting still processing: returns current status — the LLM should wait and retry

---

### mymeet_get_meeting_report

Get AI-generated summary for a processed meeting. Does NOT include transcript.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |

**Example prompt:** "What was discussed in my last sales call?"

**Response includes:** Summary, key points, action items, decisions, participants. Transcript is stripped to stay under the 25K token limit.

**Edge cases:**
- Meeting not processed yet: returns `NotReadyError` with suggestion to check status
- Meeting failed processing: returns API error with details
- Very large summary: still within token limits (transcript stripped)

---

### mymeet_get_transcript

Get the full transcript with speaker labels and timestamps.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |

**Example prompt:** "Show me exactly what John said about the pricing"

**When to use:** Only when the user needs exact quotes or the full conversation text. For summaries, use `mymeet_get_meeting_report` instead.

**Warning:** Transcripts can be very large (10K+ tokens for a 30-min meeting). The LLM should only call this when specifically needed.

**Edge cases:**
- No transcript available: returns message with suggestion to check status
- Very long meeting (2h+): transcript may be truncated by the client

---

### mymeet_search_meetings

Search meetings by title, date range, or status.

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | No | — | Search by meeting title |
| `dateFrom` | string | No | — | ISO 8601 date (e.g. `2024-03-01`) |
| `dateTo` | string | No | — | ISO 8601 date |
| `status` | enum | No | — | `new`, `queued`, `processing`, `processed`, `failed` |
| `page` | number | No | 1 | Page number |
| `perPage` | number | No | 50 | Results per page |

**Example prompts:**
- "Find all sales meetings from last week"
- "Show me meetings that failed processing"

**How it works:** Fetches meetings from the API and filters client-side (the MyMeet API doesn't support server-side search). This means pagination happens before filtering.

**Edge cases:**
- No matches: returns `{ total: 0, meetings: [] }`
- Combined filters: all filters are AND-ed together

---

### mymeet_download_meeting

Download a meeting report in a specific format.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |
| `format` | enum | Yes | `md`, `json`, `pdf`, `docx` |

**Behavior by format:**
- `md` — Returns markdown content directly (inline in response)
- `json` — Returns JSON content directly (inline in response)
- `pdf` — Returns a download URL (binary cannot be returned through MCP)
- `docx` — Returns a download URL

**Example prompt:** "Download the report for meeting X as markdown"

**Edge cases:**
- Binary format: returns URL, not file content
- Meeting not processed: returns error

---

## Write Tools

### mymeet_record_meeting

Schedule or start recording an online meeting.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `link` | string (URL) | Yes | Meeting URL |
| `title` | string | Yes | Meeting title |
| `dateTime` | string | Yes | ISO 8601 local datetime (e.g. `2024-03-15T14:00:00`) |
| `template` | enum | Yes | One of 11 templates (see Templates section) |
| `source` | enum | No | Auto-detected from URL. Options: `gmeet`, `zoom`, `telemost`, `sberjazz`, `trueconf`, `konturtalk`, `teams`, `jitsi` |
| `password` | string | No | Meeting password if required |
| `cron` | string | No | UTC cron expression for recurring recordings |
| `participants` | string[] | No | Expected participant names |

**Source auto-detection:** The server detects the platform from the URL:
- `meet.google.com/*` → `gmeet`
- `*.zoom.us/*` or `*.zoom.com/*` → `zoom`
- `teams.microsoft.com/*` → `teams`
- `telemost.yandex.*` → `telemost`
- `jazz.sber.*` or `salute.online` → `sberjazz`
- `trueconf.*` → `trueconf`
- `konturtalk.*` → `konturtalk`
- `*jitsi*` or `meet.jit.si` → `jitsi`

**Cron examples:**
- `0 14 * * 1` — Every Monday at 14:00 UTC
- `0 9 * * 1-5` — Weekdays at 09:00 UTC
- `30 10 1 * *` — First day of each month at 10:30 UTC

**Example prompt:** "Record my Zoom meeting tomorrow at 2pm as a sales meeting"

**Edge cases:**
- Invalid URL: returns `ValidationError`
- Unrecognized platform: falls back to `gmeet`
- Past datetime: the API may reject or start immediately (depends on backend)

---

### mymeet_rename_meeting

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |
| `name` | string | Yes | New meeting title (min 1 character) |

**Example prompt:** "Rename meeting X to 'Q1 Sales Review with Acme Corp'"

---

### mymeet_regenerate_template

Re-analyze a processed meeting using a different template.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |
| `template` | enum | Yes | New template name |

**Available templates:**
| Template | Best for |
|----------|----------|
| `default-meeting` | General meetings |
| `sales-meeting` | Sales calls — extracts objections, buying signals, next steps |
| `sales-coaching` | Manager reviewing a rep's call — technique feedback |
| `hr-interview` | Candidate evaluation — strengths, concerns, recommendation |
| `research-interview` | User research — insights, patterns, quotes |
| `team-sync` | Standups/syncs — per-person updates, blockers, decisions |
| `article` | Content creation — SEO article from meeting content |
| `lecture-notes` | Education — concepts, examples, study notes |
| `one-to-one` | 1:1 meetings — feedback, goals, action items |
| `protocol` | Formal protocols — agenda items, decisions, owners |
| `medicine` | Medical consultations — anamnesis, symptoms, treatment |

**Example prompt:** "Re-analyze my last call using the sales-coaching template"

**Important:** After regeneration, the meeting goes back to `processing` status. Use `mymeet_get_meeting_status` to check when it's done.

---

### mymeet_update_summary

Edit AI-generated summary sections.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |
| `summary` | object | Yes | Key-value pairs of sections to update |

**Example prompt:** "Update the action items in meeting X to include 'Schedule follow-up with legal team'"

**Edge cases:**
- Unknown section keys: the API may ignore or reject them
- Empty summary object: returns `ValidationError`

---

### mymeet_delete_meeting

Permanently delete a meeting and all its data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | string | Yes | The unique meeting ID |

**Warning:** This action cannot be undone. The meeting, its transcript, summary, and all exports will be permanently removed.

**Example prompt:** "Delete meeting X — it was a test recording"

---

## Error Handling

All tools return structured errors with an LLM-friendly `suggestion` field:

```json
{
  "error": "AuthError",
  "message": "Authentication failed",
  "suggestion": "Check that MYMEET_API_KEY is set correctly. Get your key at https://app.mymeet.ai/settings"
}
```

| Error | HTTP Code | When | Suggestion |
|-------|-----------|------|------------|
| `AuthError` | 401 | Invalid or missing API key | Check MYMEET_API_KEY |
| `NotFoundError` | 404 | Meeting ID doesn't exist | Use mymeet_list_meetings |
| `NotReadyError` | — | Meeting not yet processed | Use mymeet_get_meeting_status |
| `ValidationError` | 400 | Invalid parameters | Check tool schema |
| `RateLimitError` | 429 | Too many requests | Auto-retry (built-in) |
| `ApiError` | 5xx | Server error | Check API status |

## MCP Resource

### mymeet://templates

Returns the list of all available templates with descriptions. Useful for the LLM to suggest the right template to the user.

**Access:** Automatic via MCP resource protocol. No parameters needed.
