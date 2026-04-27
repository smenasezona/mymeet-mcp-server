/**
 * Typed errors with LLM-friendly suggestions.
 *
 * Every error includes a `suggestion` field that tells the LLM what to do next.
 * This is our competitive advantage — most MCP servers return cryptic errors.
 */

export class MyMeetError extends Error {
  constructor(
    message: string,
    public readonly suggestion: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'MyMeetError';
  }
}

export class AuthError extends MyMeetError {
  constructor(message = 'Authentication failed') {
    super(
      message,
      'Check that MYMEET_API_KEY is set correctly. Get your key at https://app.mymeet.ai/settings',
      401,
    );
    this.name = 'AuthError';
  }
}

export class NotFoundError extends MyMeetError {
  constructor(meetingId: string) {
    super(
      `Meeting "${meetingId}" not found`,
      'Meeting not found. Use mymeet_list_meetings to see available meetings.',
      404,
    );
    this.name = 'NotFoundError';
  }
}

export class NotReadyError extends MyMeetError {
  constructor(meetingId: string, status: string) {
    super(
      `Meeting "${meetingId}" is not ready (status: ${status})`,
      'Meeting is still processing. Use mymeet_get_meeting_status to check progress and try again later.',
    );
    this.name = 'NotReadyError';
  }
}

export class ValidationError extends MyMeetError {
  constructor(details: string) {
    super(
      `Invalid parameter: ${details}`,
      `Invalid parameter: ${details}. Please check the tool schema for expected values.`,
      400,
    );
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends MyMeetError {
  constructor() {
    super(
      'Too many requests',
      'Rate limit exceeded. The tool will automatically retry — please wait a moment.',
      429,
    );
    this.name = 'RateLimitError';
  }
}

export class ApiError extends MyMeetError {
  constructor(statusCode: number, body: string) {
    super(
      `MyMeet API error ${statusCode}: ${body.slice(0, 200)}`,
      `Unexpected API error (${statusCode}). If this persists, check https://backend.mymeet.ai/docs/ for API status.`,
      statusCode,
    );
    this.name = 'ApiError';
  }
}

/**
 * Format error for MCP tool response.
 * Returns { isError: true, content: [...] } with helpful suggestion.
 */
export function formatToolError(error: unknown): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  if (error instanceof MyMeetError) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error.name,
              message: error.message,
              suggestion: error.suggestion,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: 'UnknownError',
            message,
            suggestion: 'An unexpected error occurred. Please try again or contact support at hello@mymeet.ai',
          },
          null,
          2,
        ),
      },
    ],
  };
}
