# 🗄️ LuxeFinds Database Setup Guide

## Overview

LuxeFinds uses **PostgreSQL** with **Prisma ORM** for full e-commerce functionality including:
- Product catalog management
- Order processing and history
- User accounts (prepared for future authentication)
- Shopping cart persistence
- AI Stylist chat history

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)

## Quick Start

### 1. Database Setup

Choose one of the following options:

#### Option A: Local PostgreSQL (Recommended for Development)

Install PostgreSQL locally:
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

Create the database:
```bash
# Access PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE luxefinds;
CREATE USER luxefinds_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE luxefinds TO luxefinds_user;
\q
```

#### Option B: Cloud PostgreSQL

Use a managed PostgreSQL service:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier with additional features
- **Railway** (https://railway.app) - Simple deployment
- **Heroku Postgres** - Managed solution

### 2. Configure Environment

Update your `.env` file with your database connection string:

```env
# Local PostgreSQL
DATABASE_URL="postgresql://luxefinds_user:your_secure_password@localhost:5432/luxefinds"

# Or cloud PostgreSQL (example from Neon/Supabase)
DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/dbname?sslmode=require"
```

### 3. Run Database Migrations

Generate Prisma Client and push schema to database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR create a migration (for production)
npm run db:migrate
```

### 4. Seed the Database

Populate the database with initial product data:

```bash
npm run db:seed
```

You should see output like:
```
🌱 Seeding LuxeFinds database...
🗑️  Clearing existing products...
📦 Creating products...
✅ Created: Rose Gold Diamond Necklace
✅ Created: Minimalist Gold Hoop Earrings
...
✨ Seeding completed successfully!
📊 Total products: 8
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:push` | Push schema changes to database (dev) |
| `npm run db:migrate` | Create and run migrations (production) |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## Database Schema

### Models

- **Product**: Luxury items catalog (jewelry, watches, bags, accessories)
- **User**: Customer accounts (prepared for authentication)
- **Cart**: Persistent shopping carts
- **CartItem**: Items in shopping carts
- **Order**: Customer orders with status tracking
- **OrderItem**: Line items in orders
- **ChatSession**: AI Stylist conversation history

### Key Features

- **Automatic timestamps**: `createdAt` and `updatedAt` on all models
- **Cascading deletes**: Removing a cart removes all cart items
- **Optimized indexes**: Fast queries on common fields (category, featured, userId)
- **JSON storage**: Flexible chat message and cart data storage
- **Relations**: Properly linked data (orders → items → products)

## Prisma Studio

Launch the visual database editor:

```bash
npm run db:studio
```

Opens at http://localhost:5555 - view and edit data with a GUI.

## Troubleshooting

### Connection Issues

**Error: Can't reach database server**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format in `.env`
- Ensure firewall allows port 5432

**Error: Authentication failed**
- Verify username and password in DATABASE_URL
- Check user has proper database permissions

### Migration Issues

**Error: Schema mismatch**
```bash
# Reset database (development only - deletes all data!)
npx prisma migrate reset

# Then seed again
npm run db:seed
```

### Client Generation Issues

**Error: Prisma Client not generated**
```bash
# Manually generate
npx prisma generate
```

## Production Deployment

### Using Prisma Migrate

1. Never use `db:push` in production
2. Always use migrations:
   ```bash
   npm run db:migrate
   ```
3. Commit migration files to version control
4. Run migrations in CI/CD pipeline

### Environment Variables

Set `DATABASE_URL` in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Railway: Variables tab
- Heroku: Config Vars

### Connection Pooling

For serverless deployments (Vercel, Netlify), use connection pooling:

```env
DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true"
```

Consider using:
- **Prisma Accelerate** (built-in connection pooling)
- **PgBouncer** (external connection pooler)

## Data Migration

To migrate from hardcoded data to database:

1. The app automatically falls back to hardcoded `PRODUCTS` array if database is unavailable
2. Functions in `src/lib/products.ts` handle this gracefully:
   - `getAllProducts()` - tries DB first, falls back to array
   - `getProduct(id)` - tries DB first, falls back to array
   - `getProductsInCategory()` - tries DB first, falls back to array

## Next Steps

- [ ] Add user authentication (NextAuth.js or Clerk)
- [ ] Implement cart persistence for authenticated users
- [ ] Add order management dashboard
- [ ] Enable AI chat history retrieval
- [ ] Add product inventory management
- [ ] Implement payment processing (Stripe)

## Support

For Prisma-specific issues, see:
- Prisma Docs: https://www.prisma.io/docs
- Prisma Discord: https://pris.ly/discord
