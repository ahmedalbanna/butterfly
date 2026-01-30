import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

async function initializeDatabase() {
  console.log('📦 Initializing LuxeFinds Database...\n');

  try {
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'luxefinds.db');
    
    // Create data directory if it doesn't exist
    const { mkdirSync } = await import('fs');
    const dbDir = path.dirname(dbPath);
    try {
      mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    console.log(`📍 Database location: ${dbPath}`);
    
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    
    const db = drizzle(sqlite, { schema });
    
    console.log('✓ Database connection established');

    // Create tables using raw SQL
    console.log('Creating database tables...');
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('Jewelry', 'Watches', 'Bags', 'Accessories')),
        price REAL NOT NULL,
        description TEXT NOT NULL,
        materials TEXT NOT NULL,
        care TEXT NOT NULL,
        image TEXT NOT NULL,
        images TEXT NOT NULL,
        featured INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL UNIQUE,
        quantity INTEGER NOT NULL DEFAULT 100,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);

    console.log('✓ Products table ready');
    console.log('✓ Inventory table ready');
    console.log('✓ Orders table ready');
    console.log('✓ Order items table ready');

    console.log('\n✅ Database initialization completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:seed');
    console.log('   2. Start development: npm run dev');
    
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
