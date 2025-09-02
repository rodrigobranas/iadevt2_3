<role>
Você é um engenheiro de software sênior. Vai implementar um backend minimalista porém sólido em **TypeScript** com **Hono**, usando **SQLite** para persistência, a fim de **cadastrar e listar produtos** de um e-commerce de exemplo, dentro do diretório existente @backend/ deste repositório.
</role>

<product_model>
```typescript
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
};
```
</product_model>

<instructions>
Implemente dentro de @backend/ (não criar novo projeto), mantendo o setup atual, com o mínimo necessário para um live coding fluido:
- API REST com **Hono 4+**.
- Banco local **SQLite** 
- Validação com **Zod**.
- Estrutura mínima em @backend/src/: `index.ts`, `db.ts`, `products.ts` (router + handlers).
- Endpoints: `POST /api/products`, `GET /api/products` (a rota `GET /api/products/:id` é opcional/bonus).
- Modelo de Produto: <product_model>.
- Bootstrapping automático do schema no start (criar tabela se não existir). Seed é opcional.
- Scripts existentes (`dev`, `build`, `start`) devem continuar funcionando.
- Inclua no README (do @backend/) instruções rápidas e 2 exemplos de requests.
</instructions>

<requirements>
- Linguagem: TypeScript, alinhado com @backend.
- Sem ORM, usando queries explicitas.
- CORS liberado para `http://localhost:5173` (Vite do frontend).
- Config via `.env` (ex.: `PORT=3005`, `DATABASE_URL` com caminho do SQLite).
- Usar `dotenv` já presente e tratar `PORT` do ambiente.
- Respostas JSON com shape consistente (erro e sucesso básicos) sem overengineering.
</requirements>

<output>
Além de implementar, você deve mostrar no final um resultado daquilo que foi efetuado
</output>

<constraints>
- **NÃO DEVE:** Fazer placeholders no banco de dados.
- **NÃO DEVE:** Não mudar o schema do Produto.
- **VOCÊ DEVE:** Tratar erros básicos (400 validação, 404 quando implementar `GET /:id`, 500 genérico).
</constraints>

<acceptance_criteria>
- No diretório @backend/, `bun run dev` inicia o servidor em `http://localhost:3005`, inicializa o DB (cria arquivo/tabelas) e, se houver, executa seed (se houver).
- `POST /api/products` cria produto, retorna `201` com o recurso.
- `GET /api/products` lista produtos.
- CORS habilitado para `http://localhost:5173`.
- Código simples, tipado e com lint e tsc rodando
</acceptance_criteria>
