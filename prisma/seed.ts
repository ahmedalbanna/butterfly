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
  },
  {
    id: 'p9',
    name: 'Silver Stud Earrings',
    categoryId: 'cat1',
    price: 95,
    description: 'Timeless sterling silver studs. Perfect everyday elegance.',
    materials: '925 Sterling Silver',
    care: 'Store in a dry place away from moisture.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
      "https://picsum.photos/seed/lux9/800/800"
    ],
    featured: false,
  },
  {
    id: 'p10',
    name: 'Gold Chain Bracelet',
    categoryId: 'cat1',
    price: 380,
    description: 'Delicate gold-plated chain with a timeless design.',
    materials: 'Gold-Plated Sterling Silver',
    care: 'Avoid water and harsh chemicals.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
      "https://picsum.photos/seed/lux10/800/800"
    ],
    featured: false,
  },
  {
    id: 'p11',
    name: 'Sapphire Drop Pendant',
    categoryId: 'cat1',
    price: 765,
    description: 'Elegant sapphire drop pendant set in white gold.',
    materials: '14k White Gold, 1ct Sapphire',
    care: 'Professional cleaning every 6 months.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux11/800/800"
    ],
    featured: true,
  },
  {
    id: 'p12',
    name: 'Black Leather Watch',
    categoryId: 'cat2',
    price: 450,
    description: 'Sleek design with black leather strap and minimalist dial.',
    materials: 'Stainless Steel, Black Leather Strap',
    care: 'Water resistant to 30m. Service every 5 years.',
    image: PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux12/800/800"
    ],
    featured: false,
  },
  {
    id: 'p13',
    name: 'Chronograph Steel Watch',
    categoryId: 'cat2',
    price: 620,
    description: 'Precision chronograph with steel bracelet and three sub-dials.',
    materials: 'Stainless Steel, Sapphire Crystal',
    care: 'Water resistant to 100m. Service every 3 years.',
    image: PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux13/800/800"
    ],
    featured: false,
  },
  {
    id: 'p14',
    name: 'Gold Dress Watch',
    categoryId: 'cat2',
    price: 950,
    description: 'Sophisticated dress watch in polished gold with elegant dial.',
    materials: '18k Gold Plated Steel, Leather Strap',
    care: 'Water resistant to 50m. Service every 4 years.',
    image: PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux14/800/800"
    ],
    featured: true,
  },
  {
    id: 'p15',
    name: 'Structured Leather Tote',
    categoryId: 'cat3',
    price: 890,
    description: 'Spacious tote crafted from premium leather with multiple compartments.',
    materials: 'Full-Grain Leather, Suede Lining',
    care: 'Condition monthly with leather care cream.',
    image: PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux15/800/800"
    ],
    featured: false,
  },
  {
    id: 'p16',
    name: 'Crossbody Shoulder Bag',
    categoryId: 'cat3',
    price: 520,
    description: 'Sleek crossbody bag perfect for modern living.',
    materials: 'Napa Leather, Gold Hardware',
    care: 'Treat with leather conditioner occasionally.',
    image: PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux16/800/800"
    ],
    featured: false,
  },
  {
    id: 'p17',
    name: 'Evening Frame Bag',
    categoryId: 'cat3',
    price: 750,
    description: 'Vintage-inspired frame bag with gold clasp and chain strap.',
    materials: 'Italian Leather, Gold-Plated Frame',
    care: 'Wipe with soft cloth. Store in dust bag.',
    image: PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux17/800/800"
    ],
    featured: true,
  },
  {
    id: 'p18',
    name: 'Black Sunglasses Classic',
    categoryId: 'cat4',
    price: 145,
    description: 'Iconic black frame sunglasses with polarized lenses.',
    materials: 'Acetate Frame, Polarized Glass Lenses',
    care: 'Use provided microfiber cloth for cleaning.',
    image: PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux18/800/800"
    ],
    featured: false,
  },
  {
    id: 'p19',
    name: 'Geometric Accessory Scarf',
    categoryId: 'cat4',
    price: 155,
    description: 'Modern geometric patterns on premium silk blend.',
    materials: '60% Silk, 40% Cotton',
    care: 'Hand wash in cold water. Lay flat to dry.',
    image: PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux19/800/800"
    ],
    featured: false,
  },
  {
    id: 'p20',
    name: 'Leather Gloves',
    categoryId: 'cat4',
    price: 120,
    description: 'Soft Italian leather gloves with silk lining for comfort.',
    materials: 'Italian Leather, Silk Lining',
    care: 'Wipe with damp cloth. Air dry naturally.',
    image: PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux20/800/800"
    ],
    featured: false,
  }
];

async function main() {
  console.log('🌱 Seeding LuxeFinds database...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  // Clear OrderItems first (they reference Products)
  await prisma.orderItem.deleteMany();
  // Then clear Orders and Products
  await prisma.order.deleteMany();
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
