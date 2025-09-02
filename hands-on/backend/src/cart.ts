import { z } from 'zod';
import { db } from './db';
import { randomUUID } from 'crypto';

// Schemas
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

// Services
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
    items: [] as any[],
    totalItems: 0,
    totalPrice: 0
  };
};

export const findCartBySessionId = (sessionId: string) => {
  const stmt = db.prepare(`
    SELECT * FROM carts WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
  `);
  return stmt.get(sessionId) as any | undefined;
};

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
      (
        SELECT url FROM product_images pi 
        WHERE pi.productId = p.id 
        ORDER BY position ASC, createdAt ASC LIMIT 1
      ) as image_url
    FROM carts c
    LEFT JOIN cart_items ci ON c.id = ci.cart_id
    LEFT JOIN products p ON ci.product_id = p.id
    WHERE c.session_id = ?
    ORDER BY c.created_at DESC, ci.created_at ASC
  `);

  const rows = stmt.all(sessionId) as any[];
  if (rows.length === 0) return null;

  const base = rows[0];
  const items = rows
    .filter((r) => r.item_id)
    .map((r) => ({
      id: r.item_id,
      cartId: r.cart_id,
      productId: r.product_id,
      quantity: r.quantity,
      createdAt: r.item_created_at,
      updatedAt: r.item_updated_at,
      product: {
        id: r.product_id,
        name: r.name,
        description: r.description,
        price: r.price,
        sku: r.sku,
        imageUrl: r.image_url ?? null,
      },
    }));

  const cart = {
    id: base.cart_id,
    sessionId: base.session_id,
    createdAt: base.cart_created_at,
    updatedAt: base.cart_updated_at,
    items,
  } as const;

  return {
    ...cart,
    totalItems: items.reduce((sum, it) => sum + (it.quantity ?? 0), 0),
    totalPrice: items.reduce((sum, it) => sum + (it.product.price * it.quantity), 0),
  };
};

export const addToCart = (cartId: string, productId: string, quantity: number) => {
  const now = new Date().toISOString();

  const existingItem = db
    .prepare(`SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`)
    .get(cartId, productId) as any | undefined;

  if (existingItem) {
    const stmt = db.prepare(
      `UPDATE cart_items SET quantity = quantity + ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(quantity, now, existingItem.id);
    return { ...existingItem, quantity: existingItem.quantity + quantity };
  } else {
    const id = randomUUID();
    const stmt = db.prepare(
      `INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(id, cartId, productId, quantity, now, now);
    return { id, cartId, productId, quantity, createdAt: now, updatedAt: now };
  }
};

export const updateCartItem = (itemId: string, quantity: number) => {
  const now = new Date().toISOString();
  const stmt = db.prepare(`UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?`);
  stmt.run(quantity, now, itemId);
  return db.prepare(`SELECT * FROM cart_items WHERE id = ?`).get(itemId) as any | undefined;
};

export const removeFromCart = (itemId: string) => {
  const stmt = db.prepare(`DELETE FROM cart_items WHERE id = ?`);
  stmt.run(itemId);
  return { success: true } as const;
};

export const clearCart = (cartId: string) => {
  const stmt = db.prepare(`DELETE FROM cart_items WHERE cart_id = ?`);
  stmt.run(cartId);
  return { success: true } as const;
};

