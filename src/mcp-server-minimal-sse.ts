#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

// Start server in SSE mode
console.log('Starting MCP server in SSE mode...');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Store active SSE transports by session ID
const sseTransports = new Map<string, SSEServerTransport>();

// Handle SSE connections - each connection gets its own transport
app.get('/sse', async (req, res) => {
    console.log('SSE client connected');
    
    // Create transport - it will automatically append sessionId to the endpoint
    const transport = new SSEServerTransport('/message', res);
    
    // Store transport by session ID for routing POST messages
    const sessionId = transport.sessionId;
    sseTransports.set(sessionId, transport);
    console.log(`Session ${sessionId} created`);

    // Connect the MCP server to the transport
    // Note: connect() calls start() automatically, which sends the endpoint event
    await mcpServer.connect(transport);
    console.log(`Sent endpoint URL to client: /message?sessionId=${sessionId}`);

    // Clean up when connection closes
    res.on('close', () => {
        console.log(`Session ${sessionId} closed`);
        sseTransports.delete(sessionId);
    });
});

// Handle POST messages from SSE clients
app.post('/message', async (req, res) => {
    // Extract session ID from query parameters (legacy MCP SSE pattern)
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId query parameter' });
    }

    // Look up the transport for this session
    const transport = sseTransports.get(sessionId);
    
    if (!transport) {
        return res.status(404).json({ error: `Session ${sessionId} not found or expired` });
    }

    // Route the message to the correct transport
    try {
        await transport.handlePostMessage(req, res, req.body);
    } catch (err) {
        console.error(`Error handling message for session ${sessionId}:`, err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
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
