# 🗄️ LuxeFinds Database Setup

This document provides instructions for setting up and managing the SQLite database for LuxeFinds.

## Overview

LuxeFinds uses **SQLite** as its primary database for:
- **Product Catalog**: All luxury boutique items with metadata
- **Inventory Management**: Stock levels for each product
- **Orders**: Customer orders and order history (for future expansion)
- **Order Items**: Line items within orders (for future expansion)

The database integrates with **Drizzle ORM** for type-safe queries and **better-sqlite3** for synchronous database operations.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs `better-sqlite3` and `drizzle-orm` along with other project dependencies.

### 2. Initialize the Database

```bash
npm run db:init
```

This command:
- Creates the SQLite database file at `data/luxefinds.db`
- Initializes all tables (products, inventory, orders, order_items)
- Verifies the database connection

### 3. Seed Initial Data

```bash
npm run db:seed
```

This command:
- Clears existing data (if any)
- Populates the `products` table with 8 luxury items
- Creates inventory records with 100 units for each product

### 4. Start Development

```bash
npm run dev
```

The database is now ready for use!

## Project Structure

```
src/db/
├── db.ts          # Database connection and initialization
├── schema.ts      # Drizzle ORM table definitions

src/ai/flows/
└── database-queries.ts  # Server actions for database queries

scripts/
├── init-db.ts     # Database initialization script
└── seed.ts        # Database seeding script

data/
└── luxefinds.db   # SQLite database file (auto-created)
```

## Database Schema

### Products Table
Stores all luxury boutique items.

```typescript
{
  id: string (primary key)
  name: string
  category: 'Jewelry' | 'Watches' | 'Bags' | 'Accessories'
  price: number
  description: string
  materials: string
  care: string
  image: string (main image URL)
  images: JSON (array of image URLs)
  featured: boolean
  createdAt: timestamp
}
```

### Inventory Table
Tracks stock levels for each product.

```typescript
{
  id: number (primary key, auto-increment)
  productId: string (foreign key -> products.id)
  quantity: number (default: 100)
  updatedAt: timestamp
}
```

### Orders Table (Future Use)
Stores customer orders.

```typescript
{
  id: string (primary key)
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### OrderItems Table (Future Use)
Line items within orders.

```typescript
{
  id: number (primary key, auto-increment)
  orderId: string (foreign key -> orders.id)
  productId: string (foreign key -> products.id)
  quantity: number
  price: number (price at time of purchase)
}
```

## Available Server Actions

Located in `src/ai/flows/database-queries.ts`:

### Query Functions

- **`getAllProducts()`** - Fetch all products
- **`getProductById(id)`** - Fetch a specific product
- **`getProductsByCategory(category)`** - Filter products by category
- **`getFeaturedProducts()`** - Get featured items
- **`searchProducts(query)`** - Search products by name

### Inventory Functions

- **`getInventoryLevel(productId)`** - Check stock level
- **`getProductsWithInventory()`** - Get all products with stock levels
- **`updateInventoryAfterPurchase(productId, quantity)`** - Decrease inventory

## Using Server Actions

Server actions can be called from Client Components:

```typescript
'use client';

import { getAllProducts } from '@/ai/flows/database-queries';
import { useEffect, useState } from 'react';

export function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getAllProducts().then(setProducts);
  }, []);

  return (
    // render products
  );
}
```

## Configuration

### Database Location

By default, the database is stored at `data/luxefinds.db`.

To customize the location, set the `DATABASE_URL` environment variable:

```bash
# .env
DATABASE_URL=/path/to/custom/location.db
```

### WAL Mode

The database is configured with **WAL (Write-Ahead Logging)** mode for better concurrency and performance during development.

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Initialize database schema |
| `npm run db:seed` | Populate with sample data |
| `npm run db:push` | Run Drizzle ORM migrations |
| `npm run dev` | Start development server |

## Troubleshooting

### Database file not found
Ensure the `data/` directory exists and has write permissions:
```bash
mkdir -p data
chmod 755 data
```

### "Database is locked" error
This typically occurs when multiple processes access the database simultaneously. With WAL mode enabled, this should be rare. Restart your development server if it occurs.

### Schema mismatch errors
If you modify the schema in `src/db/schema.ts`, you need to reinitialize:
```bash
npm run db:seed  # This will recreate tables
```

## Production Considerations

For production deployment on Firebase App Hosting:

1. Consider migrating to **Firestore** for cloud-hosted database
2. Set up proper backups and disaster recovery
3. Implement database migrations using Drizzle Kit
4. Monitor database performance and optimize queries

## Future Enhancements

- [ ] Add order management endpoints
- [ ] Implement customer profiles
- [ ] Add chat history persistence
- [ ] Create admin dashboard for inventory management
- [ ] Set up automated backups
- [ ] Implement query optimization and indexing
