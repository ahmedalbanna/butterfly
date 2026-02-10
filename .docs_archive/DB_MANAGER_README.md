# 🗄️ Interactive Database Manager

A comprehensive interactive terminal tool for managing all database operations in the Butterfly Store project.

## 🚀 Quick Start

Run the interactive database manager:

```bash
npm run db
```

This opens an interactive menu with all database operations.

## 📋 Available Commands

### Menu Options

1. **Generate Prisma Client** (`db:generate`)
   - Generates/updates the Prisma Client from your schema
   - Run after schema changes before using new models

2. **Create New Migration** (`db:migrate`)
   - Creates a new migration from schema changes
   - Prompts for optional migration name
   - Applies migration to development database

3. **Apply Pending Migrations** (`db:push`)
   - Applies all pending migrations to the database
   - Use in production/staging deployments

4. **View Migration Status** (`db:status`)
   - Shows all migrations and their status
   - Displays pending migrations to apply

5. **Seed Database with Sample Data** (`db:seed`)
   - Populates database with initial sample data
   - Uses `prisma/seed.ts` configuration

6. **Open Prisma Studio** (`db:studio`)
   - Opens web UI at http://localhost:5555
   - Browse and edit database records visually
   - Press Ctrl+C to close and return to menu

7. **Full Migration Dev Flow** (`db:dev`)
   - Complete development migration workflow
   - Creates migrations and applies them

8. **Reset Database** ⚠️ (`db:reset`)
   - **DELETES ALL DATA**
   - Resets migrations and recreates schema
   - Requires confirmation

9. **Combined Setup** (Generate + Push + Seed)
   - One-command setup for new environments
   - Runs: Generate → Push → Seed
   - Perfect for CI/CD pipelines

10. **Exit**
    - Closes the database manager

## 🎯 Common Workflows

### New Development Environment Setup
```bash
npm run db
# Select option 9: Combined Setup
# Automatically generates client, applies migrations, and seeds data
```

### After Schema Changes
```bash
npm run db
# Select option 2: Create New Migration
# Enter migration name (e.g., "add_user_roles")
# Database automatically updated
```

### Check What's Pending
```bash
npm run db
# Select option 4: View Migration Status
# See all migrations and which ones are pending
```

### View Data Visually
```bash
npm run db
# Select option 6: Open Prisma Studio
# Browse tables, edit records, create new entries
# Visit http://localhost:5555 in browser
```

### Full Development Reset (Start Fresh)
```bash
npm run db
# Select option 8: Reset Database
# Type "yes" to confirm
# **All data will be deleted**
```

## 🔧 Direct Commands (Skip Menu)

You can also run database commands directly:

```bash
npm run db:generate    # Generate Prisma Client
npm run db:push        # Apply migrations
npm run db:migrate     # Reset database
npm run db:seed        # Seed with sample data
npm run db:studio      # Open Prisma Studio
npm run db:status      # Check migration status
```

## 📊 Database Schema

The database includes the following main models:

- **Product**: Catalog items with images, descriptions, pricing
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items in orders
- **Cart**: Shopping carts per user
- **User**: Customer profiles
- **ChatSession**: AI stylist conversations
- **CustomerMessage**: Contact/support messages
- **VoiceCallSession**: WebRTC call records
- **Category**: Product categories
- **CustomOrder**: Custom-made accessory orders
- **SocialMediaPost**: Marketing content

## 🔐 Security Notes

- **Reset deletes everything**: Option 8 permanently deletes all database data
- **Migrations are tracked**: All migrations are recorded and tracked in the `_prisma_migrations` table
- **Schema validation**: Schema changes are validated before creating migrations

## 🐛 Troubleshooting

### "Controller is already closed" error
Already fixed! The admin notifications endpoint now handles concurrent closures gracefully.

### Migration conflicts
Run `npm run db:status` to check the current state, then resolve using the menu options.

### Database connection issues
Ensure PostgreSQL is running:
```bash
docker compose up -d postgres
```

### Seed fails
Make sure migrations are applied first (option 3), then run seed (option 5).

## 📝 Script Location

The script is located at: `scripts/db-manager.js`

It uses Node.js child processes to execute Prisma commands with full terminal output and error handling.

## 🎨 Features

- ✅ Interactive menu with color-coded output
- ✅ Confirmation prompts for destructive operations
- ✅ Real-time command output streaming
- ✅ Error handling and reporting
- ✅ Support for custom migration names
- ✅ Combined operations for efficiency
- ✅ Cross-platform compatibility (Windows, macOS, Linux)

## 📚 Related Documentation

- `DATABASE_SETUP.md` - Database configuration and setup options
- `DOCKER_DATABASE.md` - Docker commands for database services
- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Sample data seeding configuration

---

**Tip**: Use `npm run db` for an interactive experience. Use direct commands like `npm run db:push` in CI/CD pipelines where interaction isn't available.
