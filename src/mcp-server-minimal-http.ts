#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

// Start server in HTTP mode
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
