# Backend API - E-commerce Products

API REST minimalista com Hono e SQLite para cadastro e listagem de produtos.

## Setup

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Executar versão compilada
bun run start

# Executar testes
bun test

# Executar testes em modo watch
bun test:watch
```

## Configuração

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3005
DATABASE_URL=./data/database.sqlite
```

## API Endpoints

### Health Check
```
GET /health
```

### Produtos

#### Criar Produto
```
POST /api/products
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "price": number,
  "sku": "string"
}
```

#### Listar Produtos
```
GET /api/products
```

#### Buscar Produto por ID
```
GET /api/products/:id
```

#### Imagens do Produto

As imagens são armazenadas localmente em `backend/uploads` e servidas estaticamente via `GET /uploads/...`.

```
GET    /api/products/:id/images              # Lista imagens do produto
POST   /api/products/:id/images              # Adiciona imagens (arquivo ou URL)
DELETE /api/products/:id/images/:imageId     # Remove uma imagem
```

Requests suportados em `POST /api/products/:id/images`:

- Via JSON (adicionar por URL):
```
Content-Type: application/json
{
  "url": "https://exemplo.com/imagem.jpg",
  "position": 0 // opcional
}
```

- Via multipart/form-data (upload local):
```
Content-Type: multipart/form-data
Campo: images (pode enviar múltiplos arquivos)
```

## Exemplos de Requests

### Criar um produto
```bash
curl -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell XPS 13",
    "description": "Ultrabook premium com processador Intel Core i7",
    "price": 8999.99,
    "sku": "DELL-XPS-13-2024"
  }'
```

### Listar todos os produtos
```bash
curl http://localhost:3005/api/products
```

### Adicionar imagem por URL
```bash
curl -X POST http://localhost:3005/api/products/<PRODUCT_ID>/images \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://picsum.photos/seed/abc/800/600",
    "position": 0
  }'
```

### Upload de imagens (multipart)
```bash
curl -X POST http://localhost:3005/api/products/<PRODUCT_ID>/images \\
  -F "images=@/caminho/da/imagem1.jpg" \\
  -F "images=@/caminho/da/imagem2.png"
```

## Modelo de Dados

```typescript
type Product = {
  id: string;          // UUID gerado automaticamente
  name: string;        // Nome do produto
  description: string; // Descrição do produto
  price: number;       // Preço em decimal
  sku: string;         // Código único do produto
  createdAt: string;   // ISO 8601 timestamp
}
```

## Estrutura do Projeto

```
backend/
├── src/
│   ├── index.ts     # Servidor principal e configuração
│   ├── db.ts        # Configuração do SQLite e statements
│   └── products.ts  # Router e handlers dos produtos
├── data/
│   └── database.sqlite  # Banco de dados SQLite (criado automaticamente)
└── .env             # Variáveis de ambiente
```

## Características

- ✅ TypeScript com tipagem forte
- ✅ Validação de dados com Zod
- ✅ SQLite com queries preparadas (Bun:sqlite nativo)
- ✅ CORS habilitado para `http://localhost:5173`
- ✅ Bootstrapping automático do schema
- ✅ Tratamento de erros básico
- ✅ Respostas JSON consistentes
- ✅ Suite de testes completa com Bun Test

## Testes

Os testes cobrem:
- ✅ Criação de produtos (POST /api/products)
- ✅ Listagem de produtos (GET /api/products)
- ✅ Busca por ID (GET /api/products/:id)
- ✅ Validação de dados inválidos
- ✅ Tratamento de SKU duplicado
- ✅ Campos obrigatórios
- ✅ Health check
- ✅ Configuração CORS

Execute com `bun test` para rodar todos os testes.
