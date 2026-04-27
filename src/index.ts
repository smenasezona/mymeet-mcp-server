/**
 * MyMeet MCP Server — Entry Point.
 *
 * Usage:
 *   STDIO (default):  MYMEET_API_KEY=xxx npx @mymeet/mcp-server
 *   HTTP (remote):    npx @mymeet/mcp-server --http --port 3000
 *
 * In HTTP mode, clients pass their API key via Authorization header:
 *   Authorization: Bearer <mymeet-api-key>
 */
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  // ── Parse args ──────────────────────────────────────────────────────────────
  const args = process.argv.slice(2);
  const isHttp = args.includes('--http');
  const portIndex = args.indexOf('--port');
  const port = portIndex !== -1
    ? parseInt(args[portIndex + 1], 10)
    : parseInt(process.env.PORT ?? '3000', 10); // Railway sets PORT env
  const baseUrl = process.env.MYMEET_API_URL; // optional override for dev

  // ── STDIO mode: require API key from env ────────────────────────────────────
  if (!isHttp) {
    const apiKey = process.env.MYMEET_API_KEY;
    if (!apiKey) {
      console.error(
        'ERROR: MYMEET_API_KEY environment variable is required.\n' +
        'Get your API key at https://app.mymeet.ai/settings\n\n' +
        'Example:\n' +
        '  MYMEET_API_KEY=your-key npx @mymeet/mcp-server',
      );
      process.exit(1);
    }

    const server = createServer(apiKey, baseUrl);
    logger.setServer(server);
    logger.info('Starting MyMeet MCP server (STDIO transport)...');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('MyMeet MCP server connected and ready!');
    return;
  }

  // ── HTTP mode: API key from Authorization header per request ────────────────
  logger.info(`Starting MyMeet MCP server (HTTP transport on port ${port})...`);

  const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for browser-based MCP clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id, mcp-protocol-version');
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    // MCP endpoint
    const urlPath = req.url?.split('?')[0];
    if (urlPath === '/mcp') {
      // Extract API key from Authorization header
      const authHeader = req.headers['authorization'];
      const apiKey = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : process.env.MYMEET_API_KEY; // fallback for dev/testing

      if (!apiKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Missing API key',
          message: 'Provide your MyMeet API key in the Authorization header: Bearer <your-key>',
          help: 'Get your key at https://app.mymeet.ai/settings',
        }));
        return;
      }

      try {
        // Create a fresh server + transport per request (stateless mode)
        const mcpServer = createServer(apiKey, baseUrl);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // stateless — simplest deployment
        });

        res.on('close', () => {
          transport.close().catch(() => {});
          mcpServer.close().catch(() => {});
        });

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        logger.error('MCP request error', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. MCP endpoint is at /mcp');
  });

  httpServer.listen(port, '0.0.0.0', () => {
    logger.info(`MyMeet MCP server running at http://0.0.0.0:${port}/mcp`);
    logger.info('Clients connect with: Authorization: Bearer <mymeet-api-key>');
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
