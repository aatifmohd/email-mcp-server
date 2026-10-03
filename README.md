# Email MCP Server

This project is a custom Model Context Protocol (MCP) server built to allow AI Assistants (like Claude, Cursor, or custom agents) to dynamically read and interact with a user's email inbox.

It was built as a learning project to understand the MCP architecture and integrate legacy protocols (IMAP) with modern AI tools.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that allows AI models to securely access external tools and data sources. Instead of hardcoding API integrations into an AI client, the AI connects to an "MCP Server" which exposes a standardized set of Tools and Resources.

## Architecture & Tech Stack

This server is built using:
* **Node.js & TypeScript**: For type-safe backend logic.
* **@modelcontextprotocol/sdk**: The official SDK for creating MCP servers.
* **imap-simple & mailparser**: For connecting to email providers via the standard IMAP protocol and parsing raw email bodies.
* **dotenv**: For secure credential management.

### Component Breakdown

1. **The MCP Server (`src/index.ts`)**
   * We initialize an `McpServer` instance and configure it to use stdio (Standard I/O) transport. This is the standard way local MCP servers communicate securely with AI clients—they pass JSON-RPC messages back and forth through terminal input/output rather than opening web ports.
   * We register a `ListToolsRequestSchema` handler to tell the AI what tools are available.
   * We register a `CallToolRequestSchema` handler to actually execute the logic when the AI decides to use a tool.

2. **The Data Layer (`src/emailClient.ts`)**
   * This module isolates the IMAP logic.
   * **Optimization Note**: Initially, querying an inbox with thousands of emails using `['ALL']` caused severe timeouts. To optimize this, the code was refactored to first get the `total` message count from the inbox, calculate the starting sequence number (e.g., `total - limit`), and use **IMAP Sequence Ranges** (e.g., `91:*`). This ensures we only download the headers for the exact number of recent emails requested, making the tool lightning fast.

## Exposed Tools

* `list_recent_emails`: Connects to the inbox and fetches the sender, subject, and ID of the `N` most recent emails.
* `read_email`: Takes a specific email ID and fetches the full parsed text body.
* `summarize_email`: An internal mock tool demonstrating how server-side processing could work.

## How to Run & Test

### 1. Setup Credentials

Create a `.env` file in the root directory:

```env
EMAIL_ADDRESS=your_email@gmail.com
APP_PASSWORD=your_16_digit_app_password
```

*(Note: For Gmail, you must generate an App Password in your Google Account Security settings. Do not include spaces in the password).*

### 2. Build the Server

```bash
npm install
npm run build
```

### 3. Testing with MCP Inspector

The easiest way to test the server in isolation (without an AI client) is using the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This boots up a proxy server. Cmd/Ctrl + Click the URL printed in the terminal to open the web UI, click "Connect", and you can manually trigger the tools.

### 4. Connecting to Claude Desktop

To let Claude read your emails, add this server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "email-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/email-mcp-server/build/index.js"
      ],
      "env": {
        "EMAIL_ADDRESS": "your_email@gmail.com",
        "APP_PASSWORD": "your_16_digit_app_password"
      }
    }
  }
}
```

Restart Claude, and you can now ask it: *"Can you check my recent emails and summarize any important updates from my boss?"*
