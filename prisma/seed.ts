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
    name: 'Zircon rings',
    slug: 'zircon-rings',
    description: 'Exquisite zircon rings crafted with meticulous precision and timeless elegance',
    displayOrder: 1
  },
  {
    id: 'cat2',
    name: 'Plated rings',
    slug: 'plated-rings',
    description: 'Luxurious plated rings that capture the essence of refined sophistication',
    displayOrder: 2
  },
  {
    id: 'cat3',
    name: 'Steel rings',
    slug: 'steel-rings',
    description: 'Durable and elegant steel rings for the modern connoisseur',
    displayOrder: 3
  },
  {
    id: 'cat4',
    name: 'LOL rings',
    slug: 'lol-rings',
    description: 'Contemporary rings designed with distinctive flair and character',
    displayOrder: 4
  },
  {
    id: 'cat5',
    name: 'Streamlined plated bracelets',
    slug: 'streamlined-plated-bracelets',
    description: 'Refined plated bracelets with sleek, contemporary design',
    displayOrder: 5
  },
  {
    id: 'cat6',
    name: 'Zircon flow bracelets',
    slug: 'zircon-flow-bracelets',
    description: 'Exquisite zircon bracelets featuring fluid, mesmerizing designs',
    displayOrder: 6
  },
  {
    id: 'cat7',
    name: 'Streamlined steel bracelets',
    slug: 'streamlined-steel-bracelets',
    description: 'Modern steel bracelets with a clean, sophisticated aesthetic',
    displayOrder: 7
  },
  {
    id: 'cat8',
    name: 'Plated bracelets',
    slug: 'plated-bracelets',
    description: 'Luxurious plated bracelets for the discerning collector',
    displayOrder: 8
  },
  {
    id: 'cat9',
    name: 'Zirconia cuff bracelets',
    slug: 'zirconia-cuff-bracelets',
    description: 'Statement-making zirconia cuff bracelets with bold elegance',
    displayOrder: 9
  },
  {
    id: 'cat10',
    name: 'Steel bracelets',
    slug: 'steel-bracelets',
    description: 'Timeless steel bracelets combining durability with refined design',
    displayOrder: 10
  },
  {
    id: 'cat11',
    name: 'Painted smooth',
    slug: 'painted-smooth',
    description: 'Artistically painted pieces with impeccable smooth finishes',
    displayOrder: 11
  },
  {
    id: 'cat12',
    name: 'Sloss zircon',
    slug: 'sloss-zircon',
    description: 'Expertly crafted sloss zircon pieces of exceptional quality',
    displayOrder: 12
  },
  {
    id: 'cat13',
    name: 'Sloss Estelle',
    slug: 'sloss-estelle',
    description: 'Distinctive sloss Estelle collection with timeless appeal',
    displayOrder: 13
  },
  {
    id: 'cat14',
    name: 'Painted silencers',
    slug: 'painted-silencers',
    description: 'Elegantly painted silencer pieces for sophisticated styling',
    displayOrder: 14
  },
  {
    id: 'cat15',
    name: 'Zircon stones',
    slug: 'zircon-stones',
    description: 'Premium zircon stones with brilliant sparkle and clarity',
    displayOrder: 15
  },
  {
    id: 'cat16',
    name: 'Akhras Steel',
    slug: 'akhras-steel',
    description: 'Meticulously crafted Akhras steel pieces with refined beauty',
    displayOrder: 16
  },
  {
    id: 'cat17',
    name: 'Plated anklet',
    slug: 'plated-anklet',
    description: 'Luxurious plated anklets for an air of understated elegance',
    displayOrder: 17
  },
  {
    id: 'cat18',
    name: 'Zirconia anklets',
    slug: 'zirconia-anklets',
    description: 'Stunning zirconia anklets that sparkle with timeless radiance',
    displayOrder: 18
  },
  {
    id: 'cat19',
    name: 'Steel anklets',
    slug: 'steel-anklets',
    description: 'Durable steel anklets combining comfort with refined design',
    displayOrder: 19
  },
  {
    id: 'cat20',
    name: 'Reins',
    slug: 'reins',
    description: 'Distinctive rein pieces for the contemporary jewelry enthusiast',
    displayOrder: 20
  },
  {
    id: 'cat21',
    name: 'Plated belt',
    slug: 'plated-belt',
    description: 'Luxurious plated belts that elevate any ensemble',
    displayOrder: 21
  },
  {
    id: 'cat22',
    name: 'Zircon belts',
    slug: 'zircon-belts',
    description: 'Exquisite zircon belts with brilliant sparkle and sophistication',
    displayOrder: 22
  },
  {
    id: 'cat23',
    name: 'Pack it lol',
    slug: 'pack-it-lol',
    description: 'Contemporary collection pieces with playful elegance',
    displayOrder: 23
  },
  {
    id: 'cat24',
    name: 'Insaf Taqum lol',
    slug: 'insaf-taqum-lol',
    description: 'Distinctive Insaf Taqum collection with unique character',
    displayOrder: 24
  },
  {
    id: 'cat25',
    name: 'LOL fights',
    slug: 'lol-fights',
    description: 'Bold and striking LOL fights collection pieces',
    displayOrder: 25
  },
  {
    id: 'cat26',
    name: 'Indian lol kits',
    slug: 'indian-lol-kits',
    description: 'Inspired Indian LOL kits with cultural artistry',
    displayOrder: 26
  },
  {
    id: 'cat27',
    name: 'Local lol taqoomat',
    slug: 'local-lol-taqoomat',
    description: 'Local LOL taqoomat pieces with authentic charm',
    displayOrder: 27
  },
  {
    id: 'cat28',
    name: 'Half plated taqoum',
    slug: 'half-plated-taqoum',
    description: 'Elegantly designed half plated taqoum with refined aesthetics',
    displayOrder: 28
  },
  {
    id: 'cat29',
    name: 'Painted set',
    slug: 'painted-set',
    description: 'Artistically painted coordinating sets with cohesive elegance',
    displayOrder: 29
  },
  {
    id: 'cat30',
    name: 'Farfasha painted set',
    slug: 'farfasha-painted-set',
    description: 'Exquisite Farfasha painted sets with meticulous artistry',
    displayOrder: 30
  },
  {
    id: 'cat31',
    name: 'Painted mukhawar taqumat',
    slug: 'painted-mukhawar-taqumat',
    description: 'Beautifully painted mukhawar taqumat with traditional elegance',
    displayOrder: 31
  },
  {
    id: 'cat32',
    name: 'Hamat Ras',
    slug: 'hamat-ras',
    description: 'Distinctive Hamat Ras pieces with timeless appeal',
    displayOrder: 32
  },
  {
    id: 'cat33',
    name: 'Lathem Zircon',
    slug: 'lathem-zircon',
    description: 'Premium Lathem zircon collection with brilliant radiance',
    displayOrder: 33
  },
  {
    id: 'cat34',
    name: 'Lathm is painted',
    slug: 'lathm-is-painted',
    description: 'Artistically painted Lathm pieces with refined beauty',
    displayOrder: 34
  },
  {
    id: 'cat35',
    name: 'Then Estelle',
    slug: 'then-estelle',
    description: 'Timeless Then Estelle collection with enduring elegance',
    displayOrder: 35
  },
  {
    id: 'cat36',
    name: 'Thin zircon sets',
    slug: 'thin-zircon-sets',
    description: 'Delicate thin zircon sets with sparkling sophistication',
    displayOrder: 36
  },
  {
    id: 'cat37',
    name: 'Zircon half rings',
    slug: 'zircon-half-rings',
    description: 'Uniquely designed zircon half rings with contemporary flair',
    displayOrder: 37
  },
  {
    id: 'cat38',
    name: 'Bridal zircon ring',
    slug: 'bridal-zircon-ring',
    description: 'Exquisite bridal zircon rings for your most special moments',
    displayOrder: 38
  },
  {
    id: 'cat39',
    name: 'Taqum Estelle',
    slug: 'taqum-estelle',
    description: 'Elegant Taqum Estelle pieces with timeless sophistication',
    displayOrder: 39
  },
  {
    id: 'cat40',
    name: 'Insaf Taqum Estelle',
    slug: 'insaf-taqum-estelle',
    description: 'Premium Insaf Taqum Estelle collection with exceptional craftsmanship',
    displayOrder: 40
  },
  {
    id: 'cat41',
    name: 'Customized silver name designs',
    slug: 'customized-silver-name-designs',
    description: 'Personalized silver name designs crafted to your specifications',
    displayOrder: 41
  },
  {
    id: 'cat42',
    name: 'Customized silver plated name designs',
    slug: 'customized-silver-plated-name-designs',
    description: 'Bespoke silver plated name designs with personal flair',
    displayOrder: 42
  },
  {
    id: 'cat43',
    name: 'Customized gold name designs',
    slug: 'customized-gold-name-designs',
    description: 'Luxurious customized gold name designs with timeless beauty',
    displayOrder: 43
  },
  {
    id: 'cat44',
    name: 'Customized silver set designs',
    slug: 'customized-silver-set-designs',
    description: 'Personalized silver set designs tailored to your taste',
    displayOrder: 44
  },
  {
    id: 'cat45',
    name: 'Customized silver plated set designs',
    slug: 'customized-silver-plated-set-designs',
    description: 'Bespoke silver plated set designs with coordinated elegance',
    displayOrder: 45
  },
  {
    id: 'cat46',
    name: 'Customized gold set designs',
    slug: 'customized-gold-set-designs',
    description: 'Exquisite customized gold set designs for the discerning collector',
    displayOrder: 46
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
