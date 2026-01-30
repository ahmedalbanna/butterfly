
import { PlaceHolderImages } from './placeholder-images';
import { getProducts, getProductById, getProductsByCategory } from '@/app/actions/products';

export type Product = {
  id: string;
  name: string;
  category: 'Jewelry' | 'Watches' | 'Bags' | 'Accessories';
  price: number;
  description: string;
  materials: string;
  care: string;
  image: string;
  images: string[];
  featured?: boolean;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Rose Gold Diamond Necklace',
    category: 'Jewelry',
    price: 1250,
    description: 'A timeless piece featuring a brilliant round-cut diamond set in 18k rose gold. Elegant enough for special occasions, yet subtle for everyday luxury.',
    materials: '18k Rose Gold, 0.5ct Diamond (VVS1)',
    care: 'Clean with a soft polishing cloth. Avoid contact with perfumes and lotions.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-1')?.imageUrl || '',
      PlaceHolderImages.find(img => img.id === 'jewelry-1-alt')?.imageUrl || '',
      "https://picsum.photos/seed/lux1detail/800/800"
    ]
  },
  {
    id: 'p2',
    name: 'Minimalist Gold Hoop Earrings',
    category: 'Jewelry',
    price: 320,
    description: 'Crafted for modern simplicity, these thin gold hoops are lightweight and versatile.',
    materials: '14k Yellow Gold',
    care: 'Store in a dry place. Wipe with microfiber after each use.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-2')?.imageUrl || '',
      PlaceHolderImages.find(img => img.id === 'jewelry-2-alt')?.imageUrl || '',
    ],
    featured: true
  },
  {
    id: 'p3',
    name: 'Classic Pearl Bracelet',
    category: 'Jewelry',
    price: 450,
    description: 'Hand-selected freshwater pearls on a delicate silk cord with a rose gold clasp.',
    materials: 'Freshwater Pearls, Rose Gold Clasp',
    care: 'Avoid water contact. Restring annually if worn frequently.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-3')?.imageUrl || '',
      "https://picsum.photos/seed/lux3alt/800/800"
    ]
  },
  {
    id: 'p4',
    name: 'Luxe Heritage Rose Watch',
    category: 'Watches',
    price: 890,
    description: 'A masterpiece of horology. Features a sapphire crystal face and a precision Swiss movement.',
    materials: 'Stainless Steel with Rose Gold PVD, Sapphire Crystal',
    care: 'Water resistant to 50m. Service every 3-5 years.',
    image: PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'watch-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux4alt/800/800"
    ],
    featured: true
  },
  {
    id: 'p5',
    name: 'Petite Leather Clutch',
    category: 'Bags',
    price: 640,
    description: 'Handcrafted from Italian calfskin, this clutch features a minimalist design and a hidden magnetic closure.',
    materials: 'Full-grain Italian Leather, Satin Lining',
    care: 'Treat with leather conditioner periodically.',
    image: PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'bag-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux5alt/800/800"
    ]
  },
  {
    id: 'p6',
    name: 'Tortoise Shell Frames',
    category: 'Accessories',
    price: 210,
    description: 'Classic tortoise shell patterns with UV400 protection. A must-have for sunny days.',
    materials: 'Acetate, CR-39 Lenses',
    care: 'Clean with provided lens spray and cloth.',
    image: PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'sunglasses-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux6alt/800/800"
    ],
    featured: true
  },
  {
    id: 'p7',
    name: 'Botanical Silk Scarf',
    category: 'Accessories',
    price: 180,
    description: 'Hand-painted floral motifs on 100% pure mulberry silk.',
    materials: '100% Mulberry Silk',
    care: 'Dry clean only.',
    image: PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'scarf-1')?.imageUrl || '',
      "https://picsum.photos/seed/lux7alt/800/800"
    ]
  },
  {
    id: 'p8',
    name: 'Emerald Cut Ring',
    category: 'Jewelry',
    price: 2100,
    description: 'A striking emerald-cut diamond ring that captures the light from every angle.',
    materials: 'Platinum, 1.2ct Lab-Grown Diamond',
    care: 'Professional cleaning recommended every 6 months.',
    image: PlaceHolderImages.find(img => img.id === 'jewelry-4')?.imageUrl || '',
    images: [
      PlaceHolderImages.find(img => img.id === 'jewelry-4')?.imageUrl || '',
      "https://picsum.photos/seed/lux8alt/800/800"
    ]
  }
];

export const CATEGORIES = ['All', 'Jewelry', 'Watches', 'Bags', 'Accessories'];

/**
 * Get all products - fetches from database with fallback to hardcoded data
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const dbProducts = await getProducts();
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts;
    }
  } catch (error) {
    console.warn('Database not available, using hardcoded products');
  }
  return PRODUCTS;
}

/**
 * Get product by ID - fetches from database with fallback to hardcoded data
 */
export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    const dbProduct = await getProductById(id);
    if (dbProduct) {
      return dbProduct;
    }
  } catch (error) {
    console.warn('Database not available, using hardcoded products');
  }
  return PRODUCTS.find(p => p.id === id);
}

/**
 * Get products by category - fetches from database with fallback to hardcoded data
 */
export async function getProductsInCategory(category: string): Promise<Product[]> {
  try {
    const dbProducts = await getProductsByCategory(category);
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts;
    }
  } catch (error) {
    console.warn('Database not available, using hardcoded products');
  }
  
  if (category === 'All') {
    return PRODUCTS;
  }
  return PRODUCTS.filter(p => p.category === category);
}
