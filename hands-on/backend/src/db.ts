import { Database } from 'bun:sqlite';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

config();

const DATABASE_URL = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'database.sqlite');
const dbDir = path.dirname(DATABASE_URL);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DATABASE_URL, { create: true });

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize database schema
export function initDatabase(): void {
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL
    )
  `;

  const createProductImagesTable = `
    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      url TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `;

  db.exec(createProductsTable);
  db.exec(createProductImagesTable);
  
  // Cart tables
  const createCartsTable = `
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  const createCartItemsTable = `
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `;

  const createCartIndexes = `
    CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
  `;

  db.exec(createCartsTable);
  db.exec(createCartItemsTable);
  db.exec(createCartIndexes);
  
  console.log('✅ Database initialized');
}

// Get prepared statements (lazy initialization after table creation)
export function getStatements() {
  return {
    insertProduct: db.prepare(`
      INSERT INTO products (id, name, description, price, sku, createdAt)
      VALUES ($id, $name, $description, $price, $sku, $createdAt)
    `),
    
    getAllProducts: db.prepare(`
      SELECT * FROM products
      ORDER BY createdAt DESC
    `),
    
    getProductById: db.prepare(`
      SELECT * FROM products
      WHERE id = $id
    `),
    
    getProductBySku: db.prepare(`
      SELECT * FROM products
      WHERE sku = $sku
    `),
    
    updateProduct: db.prepare(`
      UPDATE products
      SET name = $name, description = $description, price = $price, sku = $sku
      WHERE id = $id
    `),
    
    deleteProduct: db.prepare(`
      DELETE FROM products
      WHERE id = $id
    `),

    // Product images
    insertProductImage: db.prepare(`
      INSERT INTO product_images (id, productId, url, position, createdAt)
      VALUES ($id, $productId, $url, $position, $createdAt)
    `),

    getImagesByProductId: db.prepare(`
      SELECT * FROM product_images
      WHERE productId = $productId
      ORDER BY position ASC, createdAt ASC
    `),

    getImageById: db.prepare(`
      SELECT * FROM product_images
      WHERE id = $id
    `),

    deleteImageById: db.prepare(`
      DELETE FROM product_images
      WHERE id = $id
    `)
  };
}
