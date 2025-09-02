<role>
Você é um engenheiro de software sênior. Vai implementar um frontend simples de e-commerce em React/TypeScript (Vite) para **listar produtos** consumindo o backend já criado na task 1 (Hono + SQLite), dentro do diretório existente @frontend/ deste monorepo.
</role>

<critical>
- **VOCÊ DEVE**: verificar os schemas e tipos do @backend antes de implementar no frontend para garantir que o dado será consumido de forma correta
</critical>

<dependent_tasks>
- Essa foi a task feita anteriormente para implementar o backend: @tasks/task_1.md
</dependent_tasks>

<backend_context>
Endpoints existentes no backend:
- `GET /api/products` → lista todos os produtos
- `POST /api/products` → cria um produto (usado para seed manual ou testes)

Observações:
- CORS já liberado para `http://localhost:5173`.
- Porta padrão do backend: `3005` (via `PORT`).
</backend_context>

<typing>
Use o mesmo shape definido na task 1. No frontend, valide as respostas com Zod:

```ts
import { z } from 'zod'

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  sku: z.string(),
  createdAt: z.string(),
})

export const productsSchema = z.array(productSchema)
export type Product = z.infer<typeof productSchema>
```
</typing>

<instructions>
Implemente dentro de @frontend/ (não criar novo projeto), mantendo o setup atual e utilizando os utilitários/componentes já existentes:
- Crie uma listagem de produtos em grid na Home (`App.tsx` pode renderizar um componente `ProductsPage`).
- Cada item deve exibir: nome, descrição, preço (formatado em BRL), e SKU.
- Estados de `loading`, `empty` e `error` devem ser tratados com componentes visuais.
- Use componentes de UI existentes em `@/components/ui/` (ex.: `card`, `skeleton`, `button`, `badge`).
- Centralize a chamada HTTP e a validação em um hook `@/hooks/use-products.ts` usando **TanStack React Query** (`useQuery`) e Zod.
- Configure o `QueryClientProvider` em `src/main.tsx` com um `QueryClient` único para o app.
- Configure o proxy do Vite para redirecionar requisições com prefixo `/api` para o backend durante o desenvolvimento; no frontend use caminhos relativos (`/api/...`).
- Adicione um botão "Adicionar produto". Ao clicar, abrir um modal com formulário (usando **react-hook-form**) para criar produto via `POST /api/products`. Em sucesso: fechar modal e atualizar a lista.
- Preserve scripts e convenções do projeto (TypeScript, ESLint, Prettier, Tailwind, path alias `@`).
</instructions>

<file_structure>
Crie/ajuste os arquivos a seguir em `@frontend/src/`:

```
src/
  hooks/
    use-products.ts        # hook para buscar/validar produtos
  components/
    product-card.tsx        # card visual do produto usando UI existente
    add-product-dialog.tsx  # (opcional) modal de criação; pode ser implementado direto na página
  pages/
    products-page.tsx       # tela que usa o hook e renderiza o grid
  App.tsx                  # renderiza <ProductsPage />
```
</file_structure>

<requirements>
- **VOCÊ DEVE**: usar TypeScript.
- **VOCÊ DEVE**: usar Vite (setup existente).
- **VOCÊ DEVE**: usar Tailwind + componentes em `@/components/ui/*`.
- **VOCÊ DEVE**: nomear arquivos de componentes em kebab-case (padrão shadcn), ex.: `product-card.tsx`.
- **VOCÊ DEVE**: validar dados com Zod.
- **VOCÊ DEVE**: usar **TanStack React Query** (`@tanstack/react-query`) para fetching/cache.
- **VOCÊ DEVE**: instalar no `@frontend/` e usar `useQuery` para estados (`loading`/`error`/`data`).
- **VOCÊ DEVE**: usar **react-hook-form** para o formulário do modal (resolver Zod é opcional).
- **VOCÊ DEVE**: usar o alias de caminho `@` como nos arquivos existentes (ex.: `@/lib/utils`).
- **VOCÊ DEVE**: configurar o proxy do Vite para `/api` e usar caminhos relativos no frontend.
- **VOCÊ DEVE**: respeitar os scripts do projeto (`dev`, `build`, `lint`, `preview`).
- **VOCÊ DEVE**: manter formatação, lint e tipagem consistentes.
</requirements>

<behavior_details>
- Carregamento: exibir placeholders com `@/components/ui/skeleton` em layout de grid.
- Sucesso: renderizar grid responsivo de cards (`@/components/ui/card`) com `name`, `description`, `price` (formatado `pt-BR`/`BRL`) e `sku` (opcional em `badge`).
- Vazio: mostrar mensagem amigável e um botão para tentar recarregar.
- Erro: mensagem clara e botão “Tentar novamente”.
- A lista deve atualizar ao clicar em “Recarregar”.
</behavior_details>

<format_price>
```ts
const formatPriceBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
```
</format_price>

<http_hook_spec>
O hook `useProducts` deve:
- Usar `useQuery` com `queryKey: ['products']` e `queryFn` que faz `GET /api/products` (proxy do Vite em dev).
- Validar a resposta com `productsSchema` antes de retornar.
- Expor o objeto do React Query (ex.: `{ data, isLoading, isError, error, refetch }`).
- Definir `staleTime` e `retry` razoáveis (ex.: `staleTime: 30_000`, `retry: 1`).
</http_hook_spec>

<vite_proxy_dev>
Configure o proxy no `@frontend/vite.config.ts`:

```ts
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
})
```

- No frontend, use caminhos relativos como `fetch('/api/products')`.
</vite_proxy_dev>

<output>
Além do código você deve fornecer um resumo de tudo que foi feito.
</output>

<constraints>
- **VOCÊ NÃO DEVE**: usar cores explícitas no Tailwind; use design tokens do tema.
- **VOCÊ NÃO DEVE**: alterar o schema do Produto.
- **VOCÊ NÃO DEVE**: adicionar dependências externas desnecessárias.
- **VOCÊ NÃO DEVE**: criar estado global; use apenas hook local nesta tarefa.
- **VOCÊ NÃO DEVE**: hardcodar hosts da API na UI; use `/api` via proxy do Vite.
</constraints>

<acceptance_criteria>
- Em `@frontend/`, `bun run dev` inicia em `http://localhost:5173` e exibe a página com grid.
- Em estado sem dados no DB, a UI mostra estado “vazio” adequadamente.
- Com produtos no DB, a UI lista corretamente (nome, descrição, preço BRL, sku).
- Tipos do TypeScript corretos e validação Zod aplicada na fronteira de dados.
- Lint/Prettier sem erros e build passando.
- Chamadas à API usam caminhos relativos `/api` em dev (via proxy do Vite).
</acceptance_criteria>

<critical>
- **VOCÊ DEVE**: verificar os schemas e tipos do @backend antes de implementar no frontend para garantir que o dado será consumido de forma correta
</critical>