import { db, getStatements } from '../src/db';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

async function copyImageToUploads(
  sourcePath: string,
  filename: string
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'products');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename to simulate upload
  const ext = path.extname(filename);
  const uniqueName = `${randomUUID()}${ext}`;
  const destPath = path.join(uploadsDir, uniqueName);

  // Copy file (simulating upload)
  fs.copyFileSync(sourcePath, destPath);

  // Return the URL path that will be stored in database
  return `/uploads/products/${uniqueName}`;
}

async function seedDatabase() {
  const statements = getStatements();

  // Check if PS5 already exists
  const existingPS5 = statements.getProductBySku.get({
    sku: 'PS5-CONSOLE-001',
  }) as any;

  if (existingPS5) {
    // Delete existing product and its images
    console.log('Removing existing PlayStation 5 product...');

    // Get and delete image files
    const images = statements.getImagesByProductId.all({
      $productId: existingPS5.id,
    }) as any[];
    for (const image of images) {
      const imagePath = path.join(process.cwd(), image.url.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`  Deleted image: ${path.basename(imagePath)}`);
      }
    }

    // Delete product (images in DB will cascade delete)
    statements.deleteProduct.run({ $id: existingPS5.id });
    console.log('✅ Removed existing PlayStation 5 product and images');
  }

  // Check if Xbox One S already exists
  const existingXbox = statements.getProductBySku.get({
    sku: 'XBOX-ONE-S-001',
  }) as any;

  if (existingXbox) {
    // Delete existing product and its images
    console.log('Removing existing Xbox One S product...');

    // Get and delete image files
    const images = statements.getImagesByProductId.all({
      $productId: existingXbox.id,
    }) as any[];
    for (const image of images) {
      const imagePath = path.join(process.cwd(), image.url.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`  Deleted image: ${path.basename(imagePath)}`);
      }
    }

    // Delete product (images in DB will cascade delete)
    statements.deleteProduct.run({ $id: existingXbox.id });
    console.log('✅ Removed existing Xbox One S product and images');
  }

  // Create PlayStation 5 product
  const ps5ProductId = randomUUID();
  const createdAt = new Date().toISOString();

  console.log('Creating PlayStation 5 product...');

  statements.insertProduct.run({
    $id: ps5ProductId,
    $name: 'PlayStation 5',
    $description:
      'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation games.',
    $price: 499.99,
    $sku: 'PS5-CONSOLE-001',
    $createdAt: createdAt,
  });

  // Upload PS5 product images
  const ps5ImageFiles = [
    'ps5-1.jpg',
    'ps5-2.jpg',
    'ps5-3.jpg',
    'ps5-4.jpg',
    'ps5-5.jpg',
  ];

  console.log('Uploading PlayStation 5 images...');

  for (let i = 0; i < ps5ImageFiles.length; i++) {
    const imageFile = ps5ImageFiles[i];
    const sourcePath = path.join(process.cwd(), '..', 'images', imageFile);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`  ⚠️  Image not found: ${sourcePath}`);
      continue;
    }

    // "Upload" the image (copy to uploads directory)
    const imageUrl = await copyImageToUploads(sourcePath, imageFile);

    // Save image reference in database
    statements.insertProductImage.run({
      $id: randomUUID(),
      $productId: ps5ProductId,
      $url: imageUrl,
      $position: i,
      $createdAt: createdAt,
    });

    console.log(`  ✅ Uploaded: ${imageFile} -> ${imageUrl}`);
  }

  // Create Xbox One S product
  const xboxProductId = randomUUID();

  console.log('\nCreating Xbox One S product...');

  statements.insertProduct.run({
    $id: xboxProductId,
    $name: 'Xbox One S',
    $description:
      'Watch 4K Blu-ray movies and stream 4K content on Netflix and Amazon Video. Experience richer, more luminous colors in games and video with High Dynamic Range. Play over 100 console exclusives and a growing library of Xbox 360 games on Xbox One.',
    $price: 249.99,
    $sku: 'XBOX-ONE-S-001',
    $createdAt: createdAt,
  });

  // Upload Xbox One S product images
  const xboxImageFiles = [
    'xbox-one-s-1.jpg',
    'xbox-one-s-2.jpg',
    'xbox-one-s-3.jpg',
    'xbox-one-s-4.jpg',
    'xbox-one-s-5.jpg',
  ];

  console.log('Uploading Xbox One S images...');

  for (let i = 0; i < xboxImageFiles.length; i++) {
    const imageFile = xboxImageFiles[i];
    const sourcePath = path.join(process.cwd(), '..', 'images', imageFile);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`  ⚠️  Image not found: ${sourcePath}`);
      continue;
    }

    // "Upload" the image (copy to uploads directory)
    const imageUrl = await copyImageToUploads(sourcePath, imageFile);

    // Save image reference in database
    statements.insertProductImage.run({
      $id: randomUUID(),
      $productId: xboxProductId,
      $url: imageUrl,
      $position: i,
      $createdAt: createdAt,
    });

    console.log(`  ✅ Uploaded: ${imageFile} -> ${imageUrl}`);
  }

  console.log('\n✅ Database seeded with products');
  console.log(`PlayStation 5 ID: ${ps5ProductId}`);
  console.log(`Xbox One S ID: ${xboxProductId}`);
  console.log(`Total images uploaded: ${ps5ImageFiles.length + xboxImageFiles.length}`);
}

// Run the seed
async function main() {
  try {
    await seedDatabase();
    db.close();
    console.log('\n✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    db.close();
    process.exit(1);
  }
}

main();
