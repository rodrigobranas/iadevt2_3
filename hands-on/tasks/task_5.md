# Task 5: Implementação Completa da Feature de Carrinho

## Visão Geral

Este documento apresenta o planejamento completo para implementar uma feature de carrinho que englobará tanto o backend quanto o frontend, seguindo os padrões e boas práticas já estabelecidos no projeto.

## Arquitetura e Decisões Técnicas

### Abordagem Escolhida: Carrinho Persistente
- **Persistência**: Dados salvos no banco SQLite
- **Sessão**: Uso de sessionId para identificar carrinho sem autenticação completa
- **Sincronização**: React Query para cache e sincronização frontend-backend
- **Validação**: Schemas Zod em ambas as camadas

### Padrões do Projeto Mantidos
- **Backend**: Hono + SQLite + Zod validation
- **Frontend**: React + TypeScript + TanStack React Query + shadcn/ui
- **Estrutura**: Separação clara entre camadas, componentes reutilizáveis

---

## FASE 1: Design do Banco de Dados e Backend

### 1.1 Schema do Banco de Dados

```sql
-- Tabela de carrinhos
CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabela de itens do carrinho
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
```

### 1.2 Schemas Zod Backend

```typescript
// backend/src/cart.ts
import { z } from 'zod';

export const createCartSchema = z.object({
  sessionId: z.string().min(1, 'Session ID é obrigatório')
});

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID é obrigatório'),
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que 0').max(100, 'Quantidade máxima é 100')
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantidade deve ser maior que 0').max(100, 'Quantidade máxima é 100')
});

export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    sku: z.string(),
    imageUrl: z.string().nullable()
  })
});

export const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(cartItemSchema),
  totalItems: z.number().int(),
  totalPrice: z.number()
});
```

---

## FASE 2: Implementação Detalhada do Backend

### 2.1 Atualização do db.ts

```typescript
// Adicionar ao initDatabase()
export function initDatabase(): void {
  // ... código existente ...
  
  // Tabelas do carrinho
  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
  `);
}
```

### 2.2 Funções de Carrinho (backend/src/cart.ts)

```typescript
import { db } from './db';
import { randomUUID } from 'crypto';

// Criar carrinho
export const createCart = (sessionId: string) => {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO carts (id, session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(id, sessionId, now, now);
  
  return {
    id,
    sessionId,
    createdAt: now,
    updatedAt: now,
    items: [],
    totalItems: 0,
    totalPrice: 0
  };
};

// Buscar carrinho por sessionId
export const findCartBySessionId = (sessionId: string) => {
  const stmt = db.prepare(`
    SELECT * FROM carts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
  `);
  
  return stmt.get(sessionId) as any;
};

// Buscar carrinho com itens
export const getCartWithItems = (sessionId: string) => {
  const stmt = db.prepare(`
    SELECT 
      c.id as cart_id,
      c.session_id,
      c.created_at as cart_created_at,
      c.updated_at as cart_updated_at,
      ci.id as item_id,
      ci.quantity,
      ci.created_at as item_created_at,
      ci.updated_at as item_updated_at,
      p.id as product_id,
      p.name,
      p.description,
      p.price,
      p.sku,
      p.image_url
    FROM carts c
    LEFT JOIN cart_items ci ON c.id = ci.cart_id
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE c.session_id = ?
    ORDER BY c.created_at DESC, ci.created_at ASC
  `);
  
  const rows = stmt.all(sessionId) as any[];
  
  if (rows.length === 0) return null;
  
  // Transformar resultado em estrutura aninhada
  const cart = {
    id: rows[0].cart_id,
    sessionId: rows[0].session_id,
    createdAt: rows[0].cart_created_at,
    updatedAt: rows[0].cart_updated_at,
    items: rows
      .filter(row => row.item_id)
      .map(row => ({
        id: row.item_id,
        cartId: row.cart_id,
        productId: row.product_id,
        quantity: row.quantity,
        createdAt: row.item_created_at,
        updatedAt: row.item_updated_at,
        product: {
          id: row.product_id,
          name: row.name,
          description: row.description,
          price: row.price,
          sku: row.sku,
          imageUrl: row.image_url
        }
      }))
  };
  
  return {
    ...cart,
    totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  };
};

// Adicionar item ao carrinho
export const addToCart = (cartId: string, productId: string, quantity: number) => {
  const now = new Date().toISOString();
  
  // Verificar se item já existe
  const existingItem = db.prepare(`
    SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?
  `).get(cartId, productId) as any;
  
  if (existingItem) {
    // Atualizar quantidade
    const stmt = db.prepare(`
      UPDATE cart_items 
      SET quantity = quantity + ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(quantity, now, existingItem.id);
    
    return { ...existingItem, quantity: existingItem.quantity + quantity };
  } else {
    // Criar novo item
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, cartId, productId, quantity, now, now);
    
    return { id, cartId, productId, quantity, createdAt: now, updatedAt: now };
  }
};

// Atualizar quantidade do item
export const updateCartItem = (itemId: string, quantity: number) => {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE cart_items 
    SET quantity = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(quantity, now, itemId);
  
  return db.prepare(`SELECT * FROM cart_items WHERE id = ?`).get(itemId);
};

// Remover item do carrinho
export const removeFromCart = (itemId: string) => {
  const stmt = db.prepare(`DELETE FROM cart_items WHERE id = ?`);
  stmt.run(itemId);
  
  return { success: true };
};

// Limpar carrinho
export const clearCart = (cartId: string) => {
  const stmt = db.prepare(`DELETE FROM cart_items WHERE cart_id = ?`);
  stmt.run(cartId);
  
  return { success: true };
};
```

### 2.3 Endpoints REST (backend/src/index.ts)

```typescript
// Adicionar ao app principal
import { createCartSchema, addToCartSchema, updateCartItemSchema } from './cart';
import * as cartService from './cart';

// POST /api/cart - Criar carrinho
app.post('/api/cart', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = createCartSchema.parse(body);
    
    // Verificar se já existe carrinho
    let cart = cartService.getCartWithItems(sessionId);
    
    if (!cart) {
      cart = cartService.createCart(sessionId);
    }
    
    return c.json(cart, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/cart/:sessionId - Buscar carrinho
app.get('/api/cart/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    let cart = cartService.getCartWithItems(sessionId);
    
    if (!cart) {
      cart = cartService.createCart(sessionId);
    }
    
    return c.json(cart);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// POST /api/cart/:cartId/items - Adicionar item
app.post('/api/cart/:cartId/items', async (c) => {
  try {
    const cartId = c.req.param('cartId');
    const body = await c.req.json();
    const { productId, quantity } = addToCartSchema.parse(body);
    
    // Verificar se produto existe
    const product = getProduct(productId);
    if (!product) {
      return c.json({ error: 'Produto não encontrado' }, 404);
    }
    
    const item = cartService.addToCart(cartId, productId, quantity);
    
    // Atualizar timestamp do carrinho
    db.prepare(`UPDATE carts SET updated_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), cartId);
    
    return c.json(item, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// PUT /api/cart/items/:itemId - Atualizar quantidade
app.put('/api/cart/items/:itemId', async (c) => {
  try {
    const itemId = c.req.param('itemId');
    const body = await c.req.json();
    const { quantity } = updateCartItemSchema.parse(body);
    
    const item = cartService.updateCartItem(itemId, quantity);
    
    if (!item) {
      return c.json({ error: 'Item não encontrado' }, 404);
    }
    
    return c.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// DELETE /api/cart/items/:itemId - Remover item
app.delete('/api/cart/items/:itemId', async (c) => {
  try {
    const itemId = c.req.param('itemId');
    
    const result = cartService.removeFromCart(itemId);
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// DELETE /api/cart/:cartId - Limpar carrinho
app.delete('/api/cart/:cartId', async (c) => {
  try {
    const cartId = c.req.param('cartId');
    
    const result = cartService.clearCart(cartId);
    
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});
```

---

## FASE 3: Frontend - Hooks e Gerenciamento de Estado

### 3.1 SessionId Management (frontend/src/lib/session.ts)

```typescript
// Gerar e persistir sessionId no localStorage
export const SESSION_KEY = 'cart_session_id';

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
```

### 3.2 Schemas Zod Frontend (frontend/src/hooks/use-cart.ts)

```typescript
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessionId } from '@/lib/session';

// Schemas espelhando o backend
export const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    sku: z.string(),
    imageUrl: z.string().nullable()
  }),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  items: z.array(cartItemSchema),
  totalItems: z.number().int(),
  totalPrice: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// API functions
const API_BASE = 'http://localhost:3001/api';

const fetchCart = async (): Promise<z.infer<typeof cartSchema>> => {
  const sessionId = getSessionId();
  const response = await fetch(`${API_BASE}/cart/${sessionId}`);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar carrinho');
  }
  
  const data = await response.json();
  return cartSchema.parse(data);
};

const addToCartAPI = async ({ productId, quantity }: { productId: string; quantity: number }) => {
  const sessionId = getSessionId();
  
  // Primeiro, garantir que o carrinho existe
  const cartResponse = await fetch(`${API_BASE}/cart/${sessionId}`);
  const cart = await cartResponse.json();
  
  const response = await fetch(`${API_BASE}/cart/${cart.id}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity })
  });
  
  if (!response.ok) {
    throw new Error('Erro ao adicionar item ao carrinho');
  }
  
  return response.json();
};

const updateCartItemAPI = async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
  const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  
  if (!response.ok) {
    throw new Error('Erro ao atualizar item');
  }
  
  return response.json();
};

const removeFromCartAPI = async (itemId: string) => {
  const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Erro ao remover item');
  }
  
  return response.json();
};

// Hooks
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addToCartAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCartItemAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar item:', error);
    }
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: removeFromCartAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Erro ao remover item:', error);
    }
  });
};
```

---

## FASE 4: Frontend - Componentes UI e UX

### 4.1 Componente CartButton (frontend/src/components/cart-button.tsx)

```typescript
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';

export function CartButton({ onClick }: { onClick: () => void }) {
  const { data: cart, isLoading } = useCart();
  const itemCount = cart?.totalItems ?? 0;

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={onClick}
      className="relative"
      disabled={isLoading}
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
}
```

### 4.2 Componente CartDrawer (frontend/src/components/cart-drawer.tsx)

```typescript
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/hooks/use-cart';
import { CartSkeleton, CartError, CartEmpty } from './cart-states';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { data: cart, isLoading, isError } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart.mutate(itemId);
    } else {
      updateCartItem.mutate({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart.mutate(itemId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Meu Carrinho
          </SheetTitle>
          <SheetDescription>
            {cart?.totalItems ? `${cart.totalItems} item(s) no carrinho` : 'Seu carrinho está vazio'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading && <CartSkeleton />}
          {isError && <CartError onRetry={() => window.location.reload()} />}
          {cart && cart.items.length === 0 && <CartEmpty />}
          
          {cart && cart.items.length > 0 && (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={updateCartItem.isPending}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updateCartItem.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeFromCart.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(cart.totalPrice)}</span>
            </div>
            
            <Button className="w-full" size="lg">
              Finalizar Compra
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### 4.3 Componente CartItem para ProductCard

```typescript
// Atualização no frontend/src/components/product-card.tsx
import { useAddToCart } from '@/hooks/use-cart';
import { toast } from 'sonner';

// Adicionar dentro do ProductCard component:
const addToCart = useAddToCart();

const handleAddToCart = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  addToCart.mutate(
    { productId: product.id, quantity: 1 },
    {
      onSuccess: () => {
        toast.success('Produto adicionado ao carrinho!');
      },
      onError: () => {
        toast.error('Erro ao adicionar produto ao carrinho');
      }
    }
  );
};

// Adicionar botão no JSX:
<Button 
  onClick={handleAddToCart}
  disabled={addToCart.isPending}
  className="w-full"
>
  {addToCart.isPending ? 'Adicionando...' : 'Adicionar ao Carrinho'}
</Button>
```

---

## FASE 5: Integração e Estados de UX

### 5.1 Componentes de Estado (frontend/src/components/cart-states.tsx)

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertCircle, RefreshCw } from 'lucide-react';

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Erro ao carregar carrinho</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        Seu carrinho está vazio
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Adicione alguns produtos para começar suas compras
      </p>
      <Button variant="outline" onClick={() => window.location.href = '/'}>
        Continuar Comprando
      </Button>
    </div>
  );
}
```

### 5.2 Integração com App Principal (frontend/src/App.tsx)

```typescript
// Adicionar ao App.tsx
import { useState } from 'react';
import { CartButton } from '@/components/cart-button';
import { CartDrawer } from '@/components/cart-drawer';

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header com CartButton */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Minha Loja</h1>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <CartButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main>
        <ProductsPage />
      </main>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
```

---

## FASE 6: Testes e Validação

### 6.1 Testes Backend (backend/src/cart.test.ts)

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { testClient } from 'hono/testing';
import { app } from './index';

describe('Cart API', () => {
  const client = testClient(app);

  beforeEach(async () => {
    // Limpar banco de dados de teste
    await cleanupDatabase();
  });

  describe('POST /api/cart', () => {
    it('should create a new cart', async () => {
      const response = await client.cart.$post({
        json: { sessionId: 'test-session-123' }
      });
      
      expect(response.status).toBe(201);
      const cart = await response.json();
      expect(cart.sessionId).toBe('test-session-123');
      expect(cart.id).toBeDefined();
    });
  });

  describe('POST /api/cart/:cartId/items', () => {
    it('should add item to cart', async () => {
      // Criar produto e carrinho primeiro
      const product = await createTestProduct();
      const cart = await createTestCart();
      
      const response = await client.cart[':cartId'].items.$post({
        param: { cartId: cart.id },
        json: { productId: product.id, quantity: 2 }
      });
      
      expect(response.status).toBe(201);
      const item = await response.json();
      expect(item.quantity).toBe(2);
      expect(item.productId).toBe(product.id);
    });

    it('should update quantity if item already exists', async () => {
      // Teste de duplicação de item
    });

    it('should validate quantity is positive', async () => {
      // Teste de validação
    });
  });

  describe('GET /api/cart/:sessionId', () => {
    it('should return cart with items and totals', async () => {
      // Teste de busca com cálculos corretos
    });

    it('should return empty cart for new session', async () => {
      // Teste de carrinho vazio
    });
  });
});
```

### 6.2 Testes Frontend (frontend/src/hooks/use-cart.test.tsx)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCart } from './use-cart';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCart', () => {
  it('should fetch cart data', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe('useAddToCart', () => {
  it('should add item to cart and invalidate cache', async () => {
    // Mock da API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCartItem)
    });

    const { result } = renderHook(() => useAddToCart(), {
      wrapper: createWrapper()
    });

    result.current.mutate({
      productId: 'test-product',
      quantity: 1
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

---

## FASE 7: Otimizações e Performance

### 7.1 Backend Otimizações

```typescript
// Cache de sessão para evitar criação desnecessária de carrinhos
const sessionCache = new Map<string, string>(); // sessionId -> cartId

// Middleware de limpeza automática de carrinhos antigos
export const cleanupOldCarts = () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`DELETE FROM carts WHERE updated_at < ?`).run(thirtyDaysAgo);
};

// Executar limpeza diariamente
setInterval(cleanupOldCarts, 24 * 60 * 60 * 1000);
```

### 7.2 Frontend Otimizações

```typescript
// Optimistic updates
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addToCartAPI,
    onMutate: async ({ productId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      
      // Snapshot previous value
      const previousCart = queryClient.getQueryData(['cart']);
      
      // Optimistically update
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;
        
        const existingItemIndex = old.items.findIndex(
          (item: any) => item.productId === productId
        );
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const newItems = [...old.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity
          };
          
          return {
            ...old,
            items: newItems,
            totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
          };
        }
        
        return old;
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
};
```

---

## Checklist de Implementação

### Backend ✓
- [ ] Tabelas do banco de dados (carts, cart_items)
- [ ] Schemas Zod para validação
- [ ] Endpoints REST completos
- [ ] Tratamento de erros
- [ ] Otimizações de query
- [ ] Limpeza automática de carrinhos antigos
- [ ] Testes unitários e de integração

### Frontend ✓
- [ ] Hooks customizados (useCart, useAddToCart, etc.)
- [ ] Componentes UI (CartButton, CartDrawer, CartItem)
- [ ] Estados de loading/error/empty
- [ ] Integração com React Query
- [ ] SessionId management
- [ ] Optimistic updates
- [ ] Testes de componentes e hooks

### Integração ✓
- [ ] Comunicação frontend-backend
- [ ] Validação em ambas as camadas
- [ ] Cache management
- [ ] Error boundaries
- [ ] Loading states consistentes

### Deployment ✓
- [ ] Scripts de deploy
- [ ] Migrations automáticas
- [ ] Testes automatizados
- [ ] Build otimizada

---

## Próximos Passos para Implementação

1. **Implementar Backend:**
   - Atualizar db.ts com novas tabelas
   - Criar cart.ts com todas as funções
   - Adicionar rotas ao index.ts
   - Executar testes

2. **Implementar Frontend:**
   - Criar hooks use-cart.ts
   - Implementar componentes CartButton, CartDrawer, CartItem
   - Integrar com páginas existentes
   - Adicionar testes

3. **Integração e Testes:**
   - Testar fluxo completo
   - Ajustar estados de loading/error
   - Validar performance
   - Deploy final

---

## Considerações Finais

Este planejamento completo segue todas as boas práticas e padrões já estabelecidos no projeto:

- **Validação dupla** com Zod em backend e frontend
- **Componentes reutilizáveis** seguindo o padrão shadcn/ui
- **Gerenciamento de estado** com React Query para cache otimizado
- **Tratamento de erros** consistente em todas as camadas
- **Testes abrangentes** para garantir qualidade
- **Performance otimizada** com queries eficientes e updates otimistas
- **UX polida** com estados de loading, error e empty bem definidos

A implementação resultará em um sistema de carrinho robusto, performático e com excelente experiência do usuário, mantendo a consistência com o resto da aplicação.
