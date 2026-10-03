import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  listRecentEmails,
  readEmail,
  summarizeEmail,
} from "./emailClient.js";

const server = new McpServer({
  name: "email-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "list_recent_emails",
  {
    description: "List recent emails from the inbox",
    inputSchema: {
      limit: z.number().min(1).max(50).optional(),
    },
  },
  async ({ limit = 10 }) => {
    try {
      const emails = await listRecentEmails(limit);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(emails, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch emails: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "read_email",
  {
    description: "Read the full content of a specific email",
    inputSchema: {
      uid: z.number(),
    },
  },
  async ({ uid }) => {
    try {
      const email = await readEmail(uid);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(email, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to read email: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "summarize_email",
  {
    description: "Generate a short summary of a specific email",
    inputSchema: {
      uid: z.number(),
    },
  },
  async ({ uid }) => {
    try {
      const summary = await summarizeEmail(uid);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to summarize email: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();

await server.connect(transport);