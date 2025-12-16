#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

// Create MCP server instance
const mcpServer = new McpServer(
    {
        name: 'mcp-server-minimal',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Register the "hello" tool
mcpServer.registerTool(
    'hello',
    {
        description: 'Returns a hello world message',
    },
    async () => {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Hello, world!',
                },
            ],
        };
    }
);

// Parse command-line arguments
const args = process.argv.slice(2);
const mode = args.find((arg) => ['--stdio', '--sse', '--http'].includes(arg)) || '--stdio';

// Run based on mode
if (mode === '--stdio') {
    // Stdio mode requires async
    (async () => {
        console.log('Starting MCP server in stdio mode...');
        const stdioTransport = new StdioServerTransport();
        await mcpServer.connect(stdioTransport);
        console.log('MCP server running in stdio mode');
    })().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
} else if (mode === '--sse') {
    console.log('Starting MCP server in SSE mode...');
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.json());

    // Store active SSE transports by session ID
    const sseTransports = new Map<string, SSEServerTransport>();

    // Handle SSE connections - each connection gets its own transport
    app.get('/sse', async (req, res) => {
        console.log('SSE client connected');
        const transport = new SSEServerTransport('/message', res);
        await mcpServer.connect(transport);

        // Store transport by session ID for routing POST messages
        const sessionId = transport.sessionId;
        sseTransports.set(sessionId, transport);
        console.log(`Session ${sessionId} created`);

        // Clean up when connection closes
        res.on('close', () => {
            console.log(`Session ${sessionId} closed`);
            sseTransports.delete(sessionId);
        });
    });

    // Handle POST messages from SSE clients
    app.post('/message', async (req, res) => {
        // Find the transport for this message
        // The client should include the session ID in the URL or headers
        // For simplicity, try all transports (works for single client)
        let handled = false;
        for (const transport of sseTransports.values()) {
            try {
                await transport.handlePostMessage(req, res, req.body);
                handled = true;
                break;
            } catch (err) {
                // This transport couldn't handle it, try next
            }
        }

        if (!handled) {
            res.status(404).json({ error: 'No active SSE session found' });
        }
    });

    const server = app.listen(port, () => {
        console.log(`MCP server running in SSE/HTTP mode on http://localhost:${port}/sse`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            console.error(
                `Error: Port ${port} is already in use. Please stop the other process or use a different port.`
            );
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
} else if (mode === '--http') {
    console.log('Starting MCP server in HTTP mode...');
    const httpApp = express();
    const httpPort = process.env.PORT || 3000;

    httpApp.use(express.json());

    // Create a single transport instance in stateless mode
    const httpTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
    });

    // Connect the MCP server to the transport once
    (async () => {
        await mcpServer.connect(httpTransport);
        console.log('MCP server connected to transport');
    })();

    // Handle all MCP requests
    httpApp.all('/mcp', async (req, res) => {
        console.log(`Request: ${req.method} ${req.url}`);
        await httpTransport.handleRequest(req, res, req.body);
    });

    const httpServer = httpApp.listen(httpPort, () => {
        console.log(`MCP server running in HTTP mode on http://localhost:${httpPort}/mcp`);
    });

    httpServer.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            console.log(
                `Error: Port ${httpPort} is already in use. Please stop the other process or use a different port.`
            );
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
} else {
    console.error('Invalid mode. Use --stdio, --sse, or --http');
    process.exit(1);
}
