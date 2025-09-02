import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pgPromise from "pg-promise";

// Configuração do banco de dados
const pgp = pgPromise();

// String de conexão - ajuste conforme suas configurações
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/app';
const db = pgp(connectionString);

const server = new McpServer({
    name: "PostgreSQL Query Executor",
    version: "1.0.0"
});

// Tool para executar queries SELECT (somente leitura)
server.tool('execute_query', 'Execute a SELECT query on PostgreSQL database', 
   {
        query: z.string().describe('SQL SELECT query to execute')
    }, 
    async ({ query }) => {
    try {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery.startsWith('select')) {
            throw new Error('Only SELECT queries are allowed for security reasons');
        }
        
        const result = await db.any(query);
        
        return {
            content: [
                {
                    type: "text",
                    text: `Query executed successfully:\n\nSQL: ${query}\n\nResults (${result.length} rows):\n${JSON.stringify(result, null, 2)}`
                }
            ]
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing query: ${error.message}`
                }
            ]
        };
    }
});

const transport = new StdioServerTransport();
server.connect(transport);

// Para usar: claude mcp add postgres-mcp --scope user node /Users/rodrigobranas/development/workspace/branas/iadevt2_3/mcp/sql.js 