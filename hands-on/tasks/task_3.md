<role>
Você é um engenheiro de software sênior. Vai adicionar a capacidade de **editar** e **deletar** produtos no monorepo existente, cobrindo backend (Hono + SQLite) e frontend (React/Vite), usando o mesmo padrão simples já adotado nas tarefas anteriores.
</role>

<dependent_tasks>
- Baseie-se nas tarefas anteriores: `@tasks/task_1.md` (backend) e `@tasks/task_2.md` (frontend).
</dependent_tasks>

<product_model>
Use o mesmo modelo de produto já definido anteriormente (não alterar o schema):

```ts
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
}
```
</product_model>

<instructions>
Implemente as operações de **editar** e **deletar** produto, mantendo o setup existente e o estilo minimalista:

- Backend (@backend/):
  - Adicionar endpoints REST:
    - `PUT /api/products/:id` → atualiza um produto existente.
    - `DELETE /api/products/:id` → remove um produto existente.
  - Validar entrada com **Zod**.
  - Queries explícitas em **SQLite** (sem ORM), usando a infra atual.
  - Tratar erros básicos: `400` (validação), `404` (não encontrado), `500` (genérico).
  - Respostas JSON simples e consistentes.

- Frontend (@frontend/):
  - Na listagem, adicionar ações por item: **Editar** (abre modal com formulário) e **Excluir** (confirmação).
  - Usar **TanStack React Query** com `useMutation` para `PUT` e `DELETE` e invalidar `['products']` após sucesso.
  - Formulário com **react-hook-form** (prefill com dados do item). Em sucesso, fechar modal e atualizar lista.
  - Manter estados de `loading`/`error` durante as mutações e feedback visual simples.
  - Continuar usando o proxy do Vite com caminhos relativos (`/api/...`).
</instructions>

<backend_requirements>
- Linguagem: **TypeScript** com Hono 4+ (setup atual).
- Endpoints:
  - `PUT /api/products/:id`:
    - Body esperado (Zod): `{ name, description, price, sku }` (todos obrigatórios para simplificar; não alterar `id`/`createdAt`).
    - Retorna `200` com o recurso atualizado.
    - `404` se `:id` não existir.
  - `DELETE /api/products/:id`:
    - Retorna `204` sem corpo em sucesso.
    - `404` se `:id` não existir.
- CORS permanece liberado para `http://localhost:5173`.
- Sem alterar o schema do Produto.
</backend_requirements>

<frontend_requirements>
- Usar **TypeScript** e Vite (setup atual), Tailwind e componentes em `@/components/ui/*`.
- Validar dados com **Zod** (mesmo shape das tasks anteriores) na fronteira de dados do fetch, quando aplicável.
- Centralizar mutações em hooks (no mesmo `@/hooks/use-products.ts` ou um hook simples ao lado), usando `useMutation` + invalidation de `['products']`.
- Modal de edição usando **react-hook-form**; campos: `name`, `description`, `price` (number), `sku`.
- Botão de exclusão com confirmação simples; em sucesso, atualizar lista.
- Usar caminhos relativos `/api/...` (proxy Vite já configurado).
</frontend_requirements>

<typing>
No frontend, mantenha os tipos e schemas alinhados ao backend. Exemplo de schema de entrada para edição:

```ts
import { z } from 'zod'

export const updateProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number(),
  sku: z.string().min(1),
})
```
</typing>

<behavior_details>
- Editar: abrir modal pré-preenchido; ao salvar, desabilitar botão durante envio; em sucesso, fechar e atualizar grid.
- Excluir: pedir confirmação; durante exclusão, desabilitar ação; em sucesso, atualizar grid.
- Exibir mensagens simples para erro de edição/exclusão.
</behavior_details>

<constraints>
- **NÃO DEVE** alterar o schema do Produto.
- **NÃO DEVE** adicionar dependências desnecessárias.
- **DEVE** manter TypeScript, Zod, Hono, React Query e react-hook-form como nas tarefas anteriores.
- **DEVE** usar `/api` via proxy do Vite (sem hardcode de host na UI).
</constraints>

<acceptance_criteria>
- Backend: endpoints `PUT /api/products/:id` e `DELETE /api/products/:id` funcionam, com validação Zod, erros básicos e respostas corretas (`200` retorno atualizado; `204` para delete).
- Frontend: cada card de produto possui ações de **Editar** e **Excluir**; fluxos funcionam, estados de carregamento/erro exibidos; lista atualiza após sucesso.
- Tipos e validações coerentes com o backend; build e lint passando.
</acceptance_criteria>

<output>
Além do código, forneça um breve resumo do que foi implementado e exemplos de requests para `PUT` e `DELETE`.
</output>


