import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "Random number",
    version: "1.0.0"
});

server.tool('get_random_number', 'Generate a random number', {}, async () => {
    const randomNumber = Math.floor(Math.random() * 1000);
    return {
        content: [
            {
                type: "text",
                text: `Random number: ${randomNumber}`
            }
        ]
    }
});

server.tool('get_random_number_with_limit', 'Generate a random number with limit', {
    limit: z.number().describe('Limit')
}, async (params) => {
    const limit = params.limit;
    const randomNumber = Math.floor(Math.random() * 10000);
    return {
        content: [
            {
                type: "text",
                text: `Random number: ${randomNumber}`
            }
        ]
    }
});

const transport = new StdioServerTransport();
server.connect(transport);

// claude mcp add random-number-mcp --scope user node /Users/rodrigobranas/development/workspace/branas/iadevt2_3/mcp/random-number.js 