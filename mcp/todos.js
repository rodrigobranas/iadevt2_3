import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "Get todos",
    version: "1.0.0"
});

server.tool('get_todos', 'Get all todos from remote server', {}, async () => {
    try {
        const response = await fetch('http://localhost:3000/todos');
        const todos = await response.json();
        return {
            content: [
                {
                    type: "text",
                    text: `Todos: ${JSON.stringify(todos, null, 2)}`
                }
            ]
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching todos: ${error.message}`
                }
            ]
        }
    }
});

const transport = new StdioServerTransport();
server.connect(transport);

// claude mcp add todos-mcp --scope user node /Users/rodrigobranas/development/workspace/branas/iadevt2_3/mcp/todos.js 