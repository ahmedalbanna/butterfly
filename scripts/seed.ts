import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';
import { products, inventory } from '@/db/schema';

const PRODUCTS_DATA = [
  {
    id: 'p1',
    name: 'Rose Gold Diamond Necklace',
    category: 'Jewelry' as const,
    price: 1250,
    description: 'A timeless piece featuring a brilliant round-cut diamond set in 18k rose gold. Elegant enough for special occasions, yet subtle for everyday luxury.',
    materials: '18k Rose Gold, 0.5ct Diamond (VVS1)',
    care: 'Clean with a soft polishing cloth. Avoid contact with perfumes and lotions.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-5dfd9c216b8d?w=800&q=80'
    ]),
    featured: false,
  },
  {
    id: 'p2',
    name: 'Minimalist Gold Hoop Earrings',
    category: 'Jewelry' as const,
    price: 320,
    description: 'Crafted for modern simplicity, these thin gold hoops are lightweight and versatile.',
    materials: '14k Yellow Gold',
    care: 'Store in a dry place. Wipe with microfiber after each use.',
    image: 'https://images.unsplash.com/photo-1599643478493-6e3f07c3d9a2?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1599643478493-6e3f07c3d9a2?w=800&q=80',
      'https://images.unsplash.com/photo-1565377377754-e87a63a76b01?w=800&q=80'
    ]),
    featured: true,
  },
  {
    id: 'p3',
    name: 'Classic Pearl Bracelet',
    category: 'Jewelry' as const,
    price: 450,
    description: 'Hand-selected freshwater pearls on a delicate silk cord with a rose gold clasp.',
    materials: 'Freshwater Pearls, Rose Gold Clasp',
    care: 'Avoid water contact. Restring annually if worn frequently.',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'
    ]),
    featured: false,
  },
  {
    id: 'p4',
    name: 'Luxe Heritage Rose Watch',
    category: 'Watches' as const,
    price: 890,
    description: 'A masterpiece of horology. Features a sapphire crystal face and a precision Swiss movement.',
    materials: 'Stainless Steel with Rose Gold PVD, Sapphire Crystal',
    care: 'Water resistant to 50m. Service every 3-5 years.',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80'
    ]),
    featured: true,
  },
  {
    id: 'p5',
    name: 'Petite Leather Clutch',
    category: 'Bags' as const,
    price: 640,
    description: 'Handcrafted from Italian calfskin, this clutch features a minimalist design and a hidden magnetic closure.',
    materials: 'Full-grain Italian Leather, Satin Lining',
    care: 'Treat with leather conditioner periodically.',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80'
    ]),
    featured: false,
  },
  {
    id: 'p6',
    name: 'Tortoise Shell Frames',
    category: 'Accessories' as const,
    price: 210,
    description: 'Classic tortoise shell patterns with UV400 protection. A must-have for sunny days.',
    materials: 'Acetate, CR-39 Lenses',
    care: 'Clean with provided lens spray and cloth.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237aa25d?w=800&q=80'
    ]),
    featured: true,
  },
  {
    id: 'p7',
    name: 'Botanical Silk Scarf',
    category: 'Accessories' as const,
    price: 180,
    description: 'Hand-painted floral motifs on 100% pure mulberry silk.',
    materials: '100% Mulberry Silk',
    care: 'Dry clean only.',
    image: 'https://images.unsplash.com/photo-1434389468585-cbb4118c737f?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1434389468585-cbb4118c737f?w=800&q=80',
      'https://images.unsplash.com/photo-1515343480029-23a734423cab?w=800&q=80'
    ]),
    featured: false,
  },
  {
    id: 'p8',
    name: 'Emerald Cut Ring',
    category: 'Jewelry' as const,
    price: 2100,
    description: 'A striking emerald-cut diamond ring that captures the light from every angle.',
    materials: 'Platinum, 1.2ct Lab-Grown Diamond',
    care: 'Professional cleaning recommended every 6 months.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1515562141207-5dfd9c216b8d?w=800&q=80'
    ]),
    featured: false,
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'luxefinds.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    const db = drizzle(sqlite, { schema });

    // Clear existing data
    console.log('Clearing existing products and inventory...');
    await db.delete(inventory);
    await db.delete(products);

    // Insert products
    console.log('Inserting products...');
    for (const product of PRODUCTS_DATA) {
      await db.insert(products).values({
        ...product,
        createdAt: new Date(),
      });
    }

    // Insert inventory records
    console.log('Inserting inventory records...');
    for (const product of PRODUCTS_DATA) {
      await db.insert(inventory).values({
        productId: product.id,
        quantity: 100,
        updatedAt: new Date(),
      });
    }

    console.log('✅ Database seed completed successfully!');
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
