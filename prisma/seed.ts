import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PlaceHolderImages } from '../src/lib/placeholder-images';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoriesData = [
  {
    id: 'cat1',
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Exquisite jewelry pieces crafted with precision and elegance',
    displayOrder: 1
  },
  {
    id: 'cat2',
    name: 'Watches',
    slug: 'watches',
    description: 'Timeless timepieces that blend artistry with function',
    displayOrder: 2
  },
  {
    id: 'cat3',
    name: 'Bags',
    slug: 'bags',
    description: 'Luxurious handbags and accessories for the discerning collector',
    displayOrder: 3
  },
  {
    id: 'cat4',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Refined accessories to complete your sophisticated look',
    displayOrder: 4
  }
];

const productsData = [
  {
    id: 'p1',
    name: 'Rose Gold Diamond Necklace',
    categoryId: 'cat1',
    price: 1250,
    description: 'A timeless piece featuring a brilliant round-cut diamond set in 18k rose gold. Elegant enough for special occasions, yet subtle for everyday luxury.',
    materials: '18k Rose Gold, 0.5ct Diamond (VVS1)',
    care: 'Clean with a soft polishing cloth. Avoid contact with perfumes and lotions.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
      PlaceHolderImages.find(img => img.id === 'jewelry-1-alt')?.imageUrl || '',
      "https://picsum.photos/seed/lux1detail/800/800"
    ],
    featured: false,
  },
  {
    id: 'p2',
    name: 'Minimalist Gold Hoop Earrings',
    categoryId: 'cat1',
    price: 320,
    description: 'Crafted for modern simplicity, these thin gold hoops are lightweight and versatile.',
    materials: '14k Yellow Gold',
    care: 'Store in a dry place. Wipe with microfiber after each use.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
      PlaceHolderImages.find(img => img.id === 'jewelry-2-alt')?.imageUrl || '',
    ],
    featured: true,
  },
  {
    id: 'p3',
    name: 'Classic Pearl Bracelet',
    categoryId: 'cat1',
    price: 450,
    description: 'Hand-selected freshwater pearls on a delicate silk cord with a rose gold clasp.',
    materials: 'Freshwater Pearls, Rose Gold Clasp',
    care: 'Avoid water contact. Restring annually if worn frequently.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
      "https://picsum.photos/seed/lux3alt/800/800"
    ],
    featured: false,
  },
  {
    id: 'p4',
    name: 'Luxe Heritage Rose Watch',
    categoryId: 'cat2',
    price: 890,
    description: 'A masterpiece of horology. Features a sapphire crystal face and a precision Swiss movement.',
    materials: 'Stainless Steel with Rose Gold PVD, Sapphire Crystal',
    care: 'Water resistant to 50m. Service every 3-5 years.',
    image: PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux4alt/800/800"
    ],
    featured: true,
  },
  {
    id: 'p5',
    name: 'Petite Leather Clutch',
    categoryId: 'cat3',
    price: 640,
    description: 'Handcrafted from Italian calfskin, this clutch features a minimalist design and a hidden magnetic closure.',
    materials: 'Full-grain Italian Leather, Satin Lining',
    care: 'Treat with leather conditioner periodically.',
    image: PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux5alt/800/800"
    ],
    featured: false,
  },
  {
    id: 'p6',
    name: 'Tortoise Shell Frames',
    categoryId: 'cat4',
    price: 210,
    description: 'Classic tortoise shell patterns with UV400 protection. A must-have for sunny days.',
    materials: 'Acetate, CR-39 Lenses',
    care: 'Clean with provided lens spray and cloth.',
    image: PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux6alt/800/800"
    ],
    featured: true,
  },
  {
    id: 'p7',
    name: 'Botanical Silk Scarf',
    categoryId: 'cat4',
    price: 180,
    description: 'Hand-painted floral motifs on 100% pure mulberry silk.',
    materials: '100% Mulberry Silk',
    care: 'Dry clean only.',
    image: PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux7alt/800/800"
    ],
    featured: false,
  },
  {
    id: 'p8',
    name: 'Emerald Cut Ring',
    categoryId: 'cat1',
    price: 2100,
    description: 'A striking emerald-cut diamond ring that captures the light from every angle.',
    materials: 'Platinum, 1.2ct Lab-Grown Diamond',
    care: 'Professional cleaning recommended every 6 months.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-4')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-4')?.imageUrl || '',
      "https://picsum.photos/seed/lux8alt/800/800"
    ],
    featured: false,
  }
];

async function main() {
  console.log('🌱 Seeding LuxeFinds database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Seed categories first
  console.log('📂 Creating categories...');
  for (const category of categoriesData) {
    await prisma.category.create({
      data: category,
    });
    console.log(`✅ Created category: ${category.name}`);
  }

  // Seed products
  console.log('📦 Creating products...');
  for (const product of productsData) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Created product: ${product.name}`);
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log(`📊 Total categories: ${categoriesData.length}`);
  console.log(`📊 Total products: ${productsData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
