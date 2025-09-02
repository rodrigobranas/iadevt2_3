import { Hono } from 'hono';
import { z } from 'zod';
import { getStatements } from './db';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
};

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
});

const productsRouter = new Hono();

// Ensure uploads base directory exists (within backend/uploads)
const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_BASE_DIR)) {
  fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
}

// Create product - POST /api/products
productsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const validationResult = createProductSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        400
      );
    }

    const data = validationResult.data;
    const statements = getStatements();

    // Check if SKU already exists
    const existingProduct = statements.getProductBySku.get({
      $sku: data.sku,
    }) as Product | undefined;
    if (existingProduct) {
      return c.json(
        {
          error: 'SKU already exists',
        },
        400
      );
    }

    // Create new product
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      price: data.price,
      sku: data.sku,
      createdAt: new Date().toISOString(),
    };

    // Insert into database
    statements.insertProduct.run({
      $id: newProduct.id,
      $name: newProduct.name,
      $description: newProduct.description,
      $price: newProduct.price,
      $sku: newProduct.sku,
      $createdAt: newProduct.createdAt,
    });

    return c.json(newProduct, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500
    );
  }
});

// List all products - GET /api/products
productsRouter.get('/', (c) => {
  try {
    const statements = getStatements();
    const products = statements.getAllProducts.all() as Product[];
    
    // Add images to each product
    const productsWithImages = products.map(product => {
      const images = statements.getImagesByProductId.all({ $productId: product.id }) as ProductImage[];
      return {
        ...product,
        images: images.map(img => ({
          id: img.id,
          url: img.url,
          position: img.position
        }))
      };
    });
    
    return c.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500
    );
  }
});

// Get product by ID - GET /api/products/:id (bonus)
productsRouter.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();
    const product = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;

    if (!product) {
      return c.json(
        {
          error: 'Product not found',
        },
        404
      );
    }

    return c.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500
    );
  }
});

// Update product - PUT /api/products/:id
productsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate request body
    const validationResult = updateProductSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        400
      );
    }

    const data = validationResult.data;
    const statements = getStatements();

    // Check if product exists
    const existingProduct = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!existingProduct) {
      return c.json(
        {
          error: 'Product not found',
        },
        404
      );
    }

    // Check if SKU already exists (if different from current)
    if (data.sku !== existingProduct.sku) {
      const productWithSku = statements.getProductBySku.get({
        $sku: data.sku,
      }) as Product | undefined;
      if (productWithSku) {
        return c.json(
          {
            error: 'SKU already exists',
          },
          400
        );
      }
    }

    // Update product
    statements.updateProduct.run({
      $id: id,
      $name: data.name,
      $description: data.description,
      $price: data.price,
      $sku: data.sku,
    });

    // Return updated product
    const updatedProduct = statements.getProductById.get({
      $id: id,
    }) as Product;
    return c.json(updatedProduct, 200);
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500
    );
  }
});

// Delete product - DELETE /api/products/:id
productsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    // Check if product exists
    const existingProduct = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!existingProduct) {
      return c.json(
        {
          error: 'Product not found',
        },
        404
      );
    }

    // Delete product
    statements.deleteProduct.run({ $id: id });

    // Return 204 No Content
    return c.body(null, 204);
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json(
      {
        error: 'Internal server error',
      },
      500
    );
  }
});

// --- Product Images ---

type ProductImage = {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string;
};

const addImageByUrlSchema = z.object({
  url: z.string().url('Invalid image URL'),
  position: z.number().int().min(0).optional(),
});

// List images for a product - GET /api/products/:id/images
productsRouter.get('/:id/images', (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    // Ensure product exists
    const product = statements.getProductById.get({ $id: id });
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const images = statements.getImagesByProductId.all({
      $productId: id,
    }) as ProductImage[];
    return c.json(images, 200);
  } catch (error) {
    console.error('Error fetching product images:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add images to a product - POST /api/products/:id/images
// Supports multipart/form-data (files under field name "images") or JSON body with { url }
productsRouter.post('/:id/images', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    // Ensure product exists
    const product = statements.getProductById.get({ $id: id });
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const contentType = c.req.header('content-type') || '';

    const createdAt = new Date().toISOString();

    // Helper to insert image row
    const insertImage = (url: string, position: number = 0) => {
      const image: ProductImage = {
        id: crypto.randomUUID(),
        productId: id,
        url,
        position: position ?? 0,
        createdAt,
      };
      statements.insertProductImage.run({
        $id: image.id,
        $productId: image.productId,
        $url: image.url,
        $position: image.position,
        $createdAt: image.createdAt,
      });
      return image;
    };

    // JSON body: expects { url, position? }
    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      const validation = addImageByUrlSchema.safeParse(body);
      if (!validation.success) {
        return c.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          400
        );
      }

      const image = insertImage(
        validation.data.url,
        validation.data.position ?? 0
      );
      return c.json(image, 201);
    }

    // Multipart: files under field name "images"
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const files = formData.getAll('images');
      if (!files || files.length === 0) {
        return c.json(
          { error: 'No files provided. Use field name "images".' },
          400
        );
      }

      // Ensure product directory exists
      const productDir = path.join(UPLOADS_BASE_DIR, 'products', id);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      const savedImages: ProductImage[] = [];
      for (const f of files) {
        if (!(f instanceof File)) {
          continue;
        }
        const origName = (f as File).name || 'image';
        const safeName = origName.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;
        const filepath = path.join(productDir, uniqueName);

        const arrayBuffer = await (f as File).arrayBuffer();
        await fs.promises.writeFile(filepath, Buffer.from(arrayBuffer));

        // Public URL path (served from /uploads)
        const publicUrl = `/uploads/products/${id}/${uniqueName}`;
        const image = insertImage(publicUrl, 0);
        savedImages.push(image);
      }

      return c.json(savedImages, 201);
    }

    return c.json({ error: 'Unsupported Content-Type' }, 415);
  } catch (error) {
    console.error('Error adding product images:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete an image - DELETE /api/products/:id/images/:imageId
productsRouter.delete('/:id/images/:imageId', (c) => {
  try {
    const { id, imageId } = c.req.param();
    const statements = getStatements();

    // Ensure product exists
    const product = statements.getProductById.get({ $id: id });
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const image = statements.getImageById.get({ $id: imageId }) as
      | ProductImage
      | undefined;
    if (!image || image.productId !== id) {
      return c.json({ error: 'Image not found' }, 404);
    }

    // If local file under /uploads, try to delete file as best-effort
    if (image.url.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), 'backend', image.url); // image.url already starts with /uploads/...
      if (fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath);
        } catch {}
      }
    }

    statements.deleteImageById.run({ $id: imageId });
    return c.body(null, 204);
  } catch (error) {
    console.error('Error deleting product image:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default productsRouter;
