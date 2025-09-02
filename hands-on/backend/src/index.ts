import { Hono, type Context, type ErrorHandler } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import productsRouter from './products';
import { z } from 'zod';
import {
  createCartSchema,
  addToCartSchema,
  updateCartItemSchema,
  getCartWithItems,
  createCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from './cart';

dotenv.config();

// Initialize database on startup
initDatabase();

const app = new Hono();
const PORT = Number(process.env.PORT) || 3005;

// CORS middleware
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173'], // Vite frontend
    credentials: true,
  })
);

app.get('/health', (c: Context) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount products router
app.route('/api/products', productsRouter);

// Cart endpoints
// Create or return existing cart by session
app.post('/api/cart', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = createCartSchema.parse(body);

    let cart = getCartWithItems(sessionId);
    if (!cart) {
      cart = createCart(sessionId);
    }
    return c.json(cart, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Get cart by sessionId (creates if not exists)
app.get('/api/cart/:sessionId', (c) => {
  try {
    const { sessionId } = c.req.param();
    let cart = getCartWithItems(sessionId);
    if (!cart) {
      const created = createCart(sessionId);
      return c.json(created, 200);
    }
    return c.json(cart, 200);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Add item to cart
app.post('/api/cart/:cartId/items', async (c) => {
  try {
    const { cartId } = c.req.param();
    const body = await c.req.json();
    const { productId, quantity } = addToCartSchema.parse(body);
    const item = addToCart(cartId, productId, quantity);
    return c.json(item, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Update item quantity
app.put('/api/cart/items/:itemId', async (c) => {
  try {
    const { itemId } = c.req.param();
    const body = await c.req.json();
    const { quantity } = updateCartItemSchema.parse(body);
    const item = updateCartItem(itemId, quantity);
    if (!item) return c.json({ error: 'Item não encontrado' }, 404);
    return c.json(item, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400);
    }
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Remove item
app.delete('/api/cart/items/:itemId', (c) => {
  try {
    const { itemId } = c.req.param();
    const result = removeFromCart(itemId);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Clear cart
app.delete('/api/cart/:cartId', (c) => {
  try {
    const { cartId } = c.req.param();
    const result = clearCart(cartId);
    return c.json(result, 200);
  } catch (error) {
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Serve static uploaded files from uploads directory under /uploads/*
app.use('/uploads/*', serveStatic({ root: '.' }));

// Error handler
const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error(err.stack);
  return c.json(
    {
      error: 'Something went wrong!',
      message: err.message,
    },
    500
  );
};

app.onError(errorHandler);

// Start server with Bun
const server = Bun.serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`⚡️[server]: Server is running at http://localhost:${server.port}`);

export default app;
