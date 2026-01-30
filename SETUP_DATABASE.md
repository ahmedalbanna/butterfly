# 🚀 LuxeFinds Database Setup Guide

Welcome! This guide will help you get the SQLite database up and running for LuxeFinds.

## ⚡ Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Initialize Database
```bash
npm run db:init
```
✅ This creates the SQLite database file at `data/luxefinds.db`

### Step 3: Seed Sample Data
```bash
npm run db:seed
```
✅ This populates the database with 8 luxury products and inventory records

### Step 4: Start Development
```bash
npm run dev
```
✅ Your app is ready! The database is accessible via server actions.

---

## 📋 What Was Set Up

### Database Files Created
- `src/db/db.ts` - Database connection
- `src/db/schema.ts` - Table definitions (Drizzle ORM)
- `scripts/init-db.ts` - Initialization script
- `scripts/seed.ts` - Data seeding script
- `drizzle.config.ts` - Drizzle ORM configuration
- `.env.example` - Environment variables template

### Database Tables
1. **products** - Luxury boutique items (8 sample products)
2. **inventory** - Stock levels (100 units per product)
3. **orders** - Customer orders (ready for future use)
4. **order_items** - Order line items (ready for future use)

### Server Actions Available
All located in `src/ai/flows/database-queries.ts`:

**Read Operations:**
- `getAllProducts()` - Fetch all products
- `getProductById(id)` - Get a specific product
- `getProductsByCategory(category)` - Filter by category
- `getFeaturedProducts()` - Get featured items
- `searchProducts(query)` - Search by name
- `getInventoryLevel(productId)` - Check stock
- `getProductsWithInventory()` - Get all products with stock levels

**Write Operations:**
- `updateInventoryAfterPurchase(productId, quantity)` - Decrease inventory

---

## 💻 Using the Database in Your Code

### Example: Fetch Products in a Component

```typescript
'use client';

import { getAllProducts } from '@/ai/flows/database-queries';
import { useEffect, useState } from 'react';

export function ProductGallery() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Update Inventory After Purchase

```typescript
'use server';

import { updateInventoryAfterPurchase } from '@/ai/flows/database-queries';

export async function processPurchase(productId: string, quantity: number) {
  try {
    await updateInventoryAfterPurchase(productId, quantity);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## 🛠️ Available Commands

| Command | Purpose |
|---------|---------|
| `npm run db:init` | Initialize database schema |
| `npm run db:seed` | Populate with 8 sample products |
| `npm run db:push` | Run Drizzle ORM migrations |
| `npm run dev` | Start development server |
| `npm run typecheck` | Check TypeScript types |

---

## 📂 Database Location

By default: `data/luxefinds.db`

To customize, set the `DATABASE_URL` environment variable in `.env`:
```bash
DATABASE_URL=/custom/path/to/database.db
```

---

## ❓ Troubleshooting

### Issue: "Cannot find module 'better-sqlite3'"
**Solution:** Run `npm install` to install dependencies.

### Issue: "Database file not found"
**Solution:** Run `npm run db:init` to create the database file and schema.

### Issue: "Table doesn't exist"
**Solution:** Run `npm run db:seed` to create tables and populate data.

### Issue: "Database is locked"
**Solution:** 
1. Stop your development server (Ctrl+C)
2. Wait a few seconds
3. Restart with `npm run dev`

---

## 📚 Learn More

For detailed database documentation, see `docs/DATABASE.md`

---

## ✨ Next Steps

1. ✅ Database is initialized
2. ✅ Sample data is seeded
3. Start using server actions in your components
4. Build features that interact with the database
5. Monitor inventory levels in your checkout flow
6. Implement order tracking for future enhancements

Happy coding! 🎉
