#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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

// Start server in stdio mode
(async () => {
    console.log('Starting MCP server in stdio mode...');
    const stdioTransport = new StdioServerTransport();
    await mcpServer.connect(stdioTransport);
    console.log('MCP server running in stdio mode');
})().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
