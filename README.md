# @unsuredev/mcp-server-minimal

A minimal Model Context Protocol (MCP) server implementation with support for multiple transport modes.

## Features

- 🚀 **Multiple Transport Modes**: stdio, HTTP, and SSE (Server-Sent Events)
- 🛠️ **Simple API**: Easy to use and extend
- 📦 **TypeScript Support**: Full type definitions included
- ⚡ **Lightweight**: Minimal dependencies

## Installation

```bash
npm install -g @unsuredev/mcp-server-minimal
```

Or use it locally in your project:

```bash
npm install @unsuredev/mcp-server-minimal
```

## Usage

### Command Line

The package provides multiple executable commands:

#### stdio mode (default for MCP clients)
```bash
mcp-server-minimal-stdio
```

#### HTTP mode
```bash
mcp-server-minimal-http
```

#### SSE mode
```bash
mcp-server-minimal-sse
```

### Environment Variables

- `PORT`: Set the port for HTTP/SSE modes (default: 3000)

```bash
PORT=8080 mcp-server-minimal-http
```

## Available Tools

### hello

Returns a "Hello, world!" message.

**Example:**
```json
{
  "tool": "hello",
  "params": {}
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Hello, world!"
    }
  ]
}
```

## Transport Modes

### stdio Mode

Perfect for Claude Desktop and other MCP clients that use standard input/output.

```bash
mcp-server-minimal-stdio
```

### HTTP Mode

Stateless HTTP endpoint for integration with web services.

```bash
mcp-server-minimal-http
```

Access at: `http://localhost:3000/mcp`

### SSE Mode

Server-Sent Events for real-time communication with persistent connections.

```bash
mcp-server-minimal-sse
```

Access at: `http://localhost:3000/sse`

## Development

### Build

```bash
npm run build
```

### Run in Development

```bash
npm run start-stdio  # stdio mode
npm run start-http   # HTTP mode
npm run start-sse    # SSE mode
```

## Configuration for Claude Desktop

Add to your Claude Desktop configuration:

### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

### Linux
`~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-server-minimal": {
      "command": "mcp-server-minimal-stdio"
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "mcp-server-minimal": {
      "command": "npx",
      "args": ["@unsuredev/mcp-server-minimal-stdio"]
    }
  }
}
```

## License

ISC © Mark Abrahams

## Author

Mark Abrahams

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
