import { db } from '../src/db';

// Clean up PS5 products
const result = db
  .prepare('DELETE FROM products WHERE sku = ?')
  .run('PS5-CONSOLE-001');
console.log(`✅ Deleted ${result.changes} products with SKU: PS5-CONSOLE-001`);

db.close();
