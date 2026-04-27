/**
 * STDIO-safe logger for MCP server.
 *
 * CRITICAL: Never use console.log() anywhere in this codebase.
 * stdout is reserved for JSON-RPC messages — any other output breaks the STDIO transport.
 *
 * Before server.connect(): writes to stderr (safe for STDIO).
 * After server.connect(): routes through MCP logging API (visible in client).
 *
 * Pattern from tl;dv MCP server (github.com/tldv-public/tldv-mcp-server).
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

class McpLogger {
  private mcpServer: McpServer | null = null;

  /**
   * Call this after server.connect() to enable MCP logging API.
   */
  setServer(server: McpServer): void {
    this.mcpServer = server;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const formatted = data
      ? `${message}: ${JSON.stringify(data)}`
      : message;

    if (this.mcpServer) {
      this.mcpServer.server.sendLoggingMessage({
        level,
        data: formatted,
      });
    } else {
      // stderr is safe — does not interfere with STDIO JSON-RPC
      console.error(`[${level.toUpperCase()}] ${formatted}`);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warning', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }
}

export const logger = new McpLogger();
