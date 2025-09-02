import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';

// Test database setup
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test.sqlite');
let testPort = 0;

// Helper to make requests
async function request<T = any>(path: string, options?: RequestInit): Promise<{ response: Response; data: T }> {
  const response = await fetch(`http://localhost:${testPort}${path}`, options);
  const data = await response.json() as T;
  return { response, data };
}

describe('Products API', () => {
  let server: any;
  let db: Database;
  const cleanupPaths: Set<string> = new Set();

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Ensure test data directory exists
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Setup test database
    db = new Database(TEST_DB_PATH, { create: true });
    db.exec('PRAGMA foreign_keys = ON');
    
    // Create products and product_images tables (mirror app schema)
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        createdAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        url TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // Set test environment variables BEFORE importing the app
    process.env.DATABASE_URL = TEST_DB_PATH;
    // Not used directly, but keep for potential references
    process.env.PORT = '0';

    // Import app without running the server (we'll create our own)
    // We need to create a separate instance for testing
    const { Hono } = await import('hono');
    const { cors } = await import('hono/cors');
    const productsRouter = (await import('./products')).default;
    
    const app = new Hono();
    app.use('/*', cors({
      origin: ['http://localhost:5173'],
      credentials: true,
    }));
    
    app.get('/health', (c: any) => {
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    });
    
    app.route('/api/products', productsRouter);
    
    // Start test server
    server = Bun.serve({
      port: 0, // ask OS for an ephemeral port to avoid EADDRINUSE
      fetch: app.fetch,
    });
    // Capture assigned port for requests
    // @ts-ignore - Bun.serve returns Server with 'port'
    testPort = (server as any).port;
  });

  afterAll(() => {
    // Close server and database
    server?.stop();
    db?.close();
    
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Clean up uploaded files created during image tests
    for (const p of cleanupPaths) {
      try {
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      } catch {}
    }
  });

  beforeEach(() => {
    // Clear products table before each test
    db.exec('DELETE FROM products');
  });

  describe('POST /api/products', () => {
    test('should create a new product with valid data', async () => {
      const newProduct = {
        name: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        sku: 'TEST-001'
      };

      const { response, data } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(newProduct.name);
      expect(data.description).toBe(newProduct.description);
      expect(data.price).toBe(newProduct.price);
      expect(data.sku).toBe(newProduct.sku);
      expect(data).toHaveProperty('createdAt');
    });

    test('should return 400 for invalid data', async () => {
      const invalidProduct = {
        name: '', // Empty name
        description: 'Test',
        price: -10, // Negative price
        sku: 'TEST-002'
      };

      const { response, data } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidProduct)
      });

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
      expect(data.details.fieldErrors).toHaveProperty('name');
      expect(data.details.fieldErrors).toHaveProperty('price');
    });

    test('should return 400 for duplicate SKU', async () => {
      const product1 = {
        name: 'Product 1',
        description: 'First product',
        price: 50,
        sku: 'DUPLICATE-SKU'
      };

      const product2 = {
        name: 'Product 2',
        description: 'Second product',
        price: 75,
        sku: 'DUPLICATE-SKU'
      };

      // Create first product
      await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product1)
      });

      // Try to create second product with same SKU
      const { response, data } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product2)
      });

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'SKU already exists');
    });

    test('should validate required fields', async () => {
      const incompleteProduct = {
        name: 'Test Product'
        // Missing description, price, and sku
      };

      const { response, data } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteProduct)
      });

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
      expect(data.details.fieldErrors).toHaveProperty('description');
      expect(data.details.fieldErrors).toHaveProperty('price');
      expect(data.details.fieldErrors).toHaveProperty('sku');
    });
  });

  describe('GET /api/products', () => {
    test('should return empty array when no products exist', async () => {
      const { response, data } = await request('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test('should return all products', async () => {
      // Create test products
      const products = [
        { name: 'Product 1', description: 'Desc 1', price: 10, sku: 'SKU-1' },
        { name: 'Product 2', description: 'Desc 2', price: 20, sku: 'SKU-2' },
        { name: 'Product 3', description: 'Desc 3', price: 30, sku: 'SKU-3' }
      ];

      for (const product of products) {
        await request('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      }

      const { response, data } = await request('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
      
      // Check that all products are returned
      const skus = (data as any[]).map(p => p.sku);
      expect(skus).toContain('SKU-1');
      expect(skus).toContain('SKU-2');
      expect(skus).toContain('SKU-3');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return product by ID', async () => {
      // Create a product
      const newProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        sku: 'TEST-ID-001'
      };

      const { data: createdProduct } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      // Get product by ID
      const { response, data } = await request(`/api/products/${createdProduct.id}`);

      expect(response.status).toBe(200);
      expect(data.id).toBe(createdProduct.id);
      expect(data.name).toBe(newProduct.name);
      expect(data.description).toBe(newProduct.description);
      expect(data.price).toBe(newProduct.price);
      expect(data.sku).toBe(newProduct.sku);
    });

    test('should return 404 for non-existent product', async () => {
      const fakeId = 'non-existent-id-12345';
      const { response, data } = await request(`/api/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Product not found');
    });
  });

  describe('PUT /api/products/:id', () => {
    test('should update an existing product', async () => {
      // Create a product
      const originalProduct = {
        name: 'Original Product',
        description: 'Original Description',
        price: 50.00,
        sku: 'ORIG-001'
      };

      const { data: createdProduct } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(originalProduct)
      });

      // Update the product
      const updatedData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 75.00,
        sku: 'UPDATED-001'
      };

      const { response, data } = await request(`/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      expect(response.status).toBe(200);
      expect(data.id).toBe(createdProduct.id);
      expect(data.name).toBe(updatedData.name);
      expect(data.description).toBe(updatedData.description);
      expect(data.price).toBe(updatedData.price);
      expect(data.sku).toBe(updatedData.sku);
      expect(data.createdAt).toBe(createdProduct.createdAt); // CreatedAt should not change
    });

    test('should return 404 when updating non-existent product', async () => {
      const fakeId = 'non-existent-id-update';
      const updateData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 75.00,
        sku: 'UPDATE-404'
      };

      const { response, data } = await request(`/api/products/${fakeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Product not found');
    });

    test('should return 400 when updating with duplicate SKU', async () => {
      // Create two products
      const product1 = {
        name: 'Product 1',
        description: 'Description 1',
        price: 30.00,
        sku: 'SKU-001'
      };

      const product2 = {
        name: 'Product 2',
        description: 'Description 2',
        price: 40.00,
        sku: 'SKU-002'
      };

      await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product1)
      });

      const { data: createdProduct2 } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product2)
      });

      // Try to update product2 with product1's SKU
      const updateData = {
        name: 'Updated Product 2',
        description: 'Updated Description 2',
        price: 50.00,
        sku: 'SKU-001' // Duplicate SKU
      };

      const { response, data } = await request(`/api/products/${createdProduct2.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'SKU already exists');
    });

    test('should allow updating product with same SKU', async () => {
      // Create a product
      const originalProduct = {
        name: 'Original Product',
        description: 'Original Description',
        price: 50.00,
        sku: 'SAME-SKU'
      };

      const { data: createdProduct } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(originalProduct)
      });

      // Update the product keeping the same SKU
      const updateData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 75.00,
        sku: 'SAME-SKU' // Same SKU
      };

      const { response, data } = await request(`/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      expect(data.sku).toBe('SAME-SKU');
    });

    test('should validate required fields on update', async () => {
      // Create a product
      const originalProduct = {
        name: 'Original Product',
        description: 'Original Description',
        price: 50.00,
        sku: 'ORIG-VAL'
      };

      const { data: createdProduct } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(originalProduct)
      });

      // Try to update with invalid data
      const invalidUpdate = {
        name: '', // Empty name
        description: 'Valid Description',
        price: -10, // Negative price
        sku: ''  // Empty SKU
      };

      const { response, data } = await request(`/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidUpdate)
      });

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
      expect(data.details.fieldErrors).toHaveProperty('name');
      expect(data.details.fieldErrors).toHaveProperty('price');
      expect(data.details.fieldErrors).toHaveProperty('sku');
    });
  });

  describe('DELETE /api/products/:id', () => {
    test('should delete an existing product', async () => {
      // Create a product
      const newProduct = {
        name: 'Product to Delete',
        description: 'Will be deleted',
        price: 100.00,
        sku: 'DELETE-001'
      };

      const { data: createdProduct } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      // Delete the product
      const deleteResponse = await fetch(`http://localhost:${testPort}/api/products/${createdProduct.id}`, {
        method: 'DELETE'
      });

      expect(deleteResponse.status).toBe(204);
      // 204 No Content should have no body content
      const bodyText = await deleteResponse.text();
      expect(bodyText).toBe('');

      // Verify product is deleted
      const { response: getResponse, data: getData } = await request(`/api/products/${createdProduct.id}`);
      
      expect(getResponse.status).toBe(404);
      expect(getData).toHaveProperty('error', 'Product not found');
    });

    test('should return 404 when deleting non-existent product', async () => {
      const fakeId = 'non-existent-delete-id';
      const { response, data } = await request(`/api/products/${fakeId}`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Product not found');
    });

    test('should remove product from list after deletion', async () => {
      // Create multiple products
      const products = [
        { name: 'Product 1', description: 'Desc 1', price: 10, sku: 'DEL-LIST-1' },
        { name: 'Product 2', description: 'Desc 2', price: 20, sku: 'DEL-LIST-2' },
        { name: 'Product 3', description: 'Desc 3', price: 30, sku: 'DEL-LIST-3' }
      ];

      const createdProducts = [];
      for (const product of products) {
        const { data } = await request('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
        createdProducts.push(data);
      }

      // Delete the second product
      await fetch(`http://localhost:${testPort}/api/products/${createdProducts[1].id}`, {
        method: 'DELETE'
      });

      // Get all products
      const { data: remainingProducts } = await request('/api/products');

      expect(remainingProducts).toHaveLength(2);
      const skus = (remainingProducts as any[]).map(p => p.sku);
      expect(skus).toContain('DEL-LIST-1');
      expect(skus).toContain('DEL-LIST-3');
      expect(skus).not.toContain('DEL-LIST-2');
    });
  });

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const { response, data } = await request('/health');

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('CORS', () => {
    test('should allow requests from http://localhost:5173', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/products`, {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    });
  });

  // ---------------- Product Images ----------------
  describe('Product Images', () => {
    async function createProduct(sku: string) {
      const product = {
        name: 'P Image',
        description: 'For image tests',
        price: 10,
        sku,
      };
      const { data } = await request('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return data as any;
    }

    test('should add image by URL and list images', async () => {
      const created = await createProduct('IMG-URL-1');

      // Add by URL
      const imageUrl = 'https://example.com/image.jpg';
      const { response: postRes, data: img } = await request(`/api/products/${created.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });

      expect(postRes.status).toBe(201);
      expect(img).toHaveProperty('id');
      expect(img).toHaveProperty('url', imageUrl);
      expect(img).toHaveProperty('productId', created.id);

      // List
      const { response: listRes, data: images } = await request(`/api/products/${created.id}/images`);
      expect(listRes.status).toBe(200);
      expect(Array.isArray(images)).toBe(true);
      expect((images as any[]).length).toBeGreaterThanOrEqual(1);
      const found = (images as any[]).find((i) => i.id === img.id);
      expect(found).toBeTruthy();
    });

    test('should upload images via multipart and delete one', async () => {
      const created = await createProduct('IMG-MP-1');
      const productUploadsDir = `${process.cwd()}/uploads/products/${created.id}`;

      // Prepare form
      const form = new FormData();
      const file1 = new File([new Uint8Array([1, 2, 3])], 'photo1.jpg', { type: 'image/jpeg' });
      const file2 = new File([new Uint8Array([4, 5, 6])], 'photo2.png', { type: 'image/png' });
      form.append('images', file1);
      form.append('images', file2);

      // Upload
      const postRes = await fetch(`http://localhost:${testPort}/api/products/${created.id}/images`, {
        method: 'POST',
        body: form as any,
      });
      const saved = (await postRes.json()) as any[];
      expect(postRes.status).toBe(201);
      expect(Array.isArray(saved)).toBe(true);
      expect(saved.length).toBe(2);
      expect(saved[0].url).toMatch(new RegExp(`/uploads/products/${created.id}/`));

      // Track for cleanup
      cleanupPaths.add(productUploadsDir);

      // Ensure files exist on disk
      for (const s of saved) {
        if (typeof s.url === 'string' && s.url.startsWith('/uploads/')) {
          const local = path.join(process.cwd(), s.url);
          expect(fs.existsSync(local)).toBe(true);
        }
      }

      // Delete first image
      const delRes = await fetch(`http://localhost:${testPort}/api/products/${created.id}/images/${saved[0].id}`, {
        method: 'DELETE',
      });
      expect(delRes.status).toBe(204);

      // List again
      const { data: imagesAfter } = await request(`/api/products/${created.id}/images`);
      const ids = (imagesAfter as any[]).map((i) => i.id);
      expect(ids).not.toContain(saved[0].id);
    });

    test('should return 404 when managing images for non-existent product', async () => {
      const { response: listRes } = await request('/api/products/NOPE/images');
      expect(listRes.status).toBe(404);

      const { response: postRes } = await request('/api/products/NOPE/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/x.jpg' }),
      });
      expect(postRes.status).toBe(404);

      const delRes = await fetch(`http://localhost:${testPort}/api/products/NOPE/images/IMG`, {
        method: 'DELETE',
      });
      expect(delRes.status).toBe(404);
    });

    test('should validate multipart with no files and invalid URL body', async () => {
      const created = await createProduct('IMG-VAL-1');

      // Multipart with no files
      const form = new FormData();
      const res1 = await fetch(`http://localhost:${testPort}/api/products/${created.id}/images`, {
        method: 'POST',
        body: form as any,
      });
      const data1 = await res1.json();
      expect(res1.status).toBe(400);
      expect(data1).toHaveProperty('error');

      // Invalid URL
      const { response: res2, data: data2 } = await request(`/api/products/${created.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'not-a-url' }),
      });
      expect(res2.status).toBe(400);
      expect(data2).toHaveProperty('error', 'Validation failed');
    });
  });
});
