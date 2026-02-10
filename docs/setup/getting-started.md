# 🚀 Getting Started with LuxeFinds

Welcome! This guide will help you set up LuxeFinds from scratch.

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose (for full setup)
- Git

## ⚡ Quick Start (5 minutes)

### Option 1: Basic Setup (No Database)

If you just want to explore the UI with hardcoded product data:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (if needed)
cp .env.example .env

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:9002`

### Option 2: Full Setup (Recommended - 10 minutes)

For complete e-commerce functionality with PostgreSQL and Redis:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL and Redis with Docker
docker compose up -d postgres redis

# 3. Set up database schema and seed data
npm run db:generate
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
```

**Database Credentials** (already configured in `.env`):
- User: `luxefinds_admin`
- Password: `luxefinds_secure_pass_2026`
- Database: `luxefinds`
- Port: 5432

## 🔧 Environment Configuration

Key environment variables needed:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5432/luxefinds
REDIS_URL=redis://localhost:6379

# Firebase (for authentication)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... other Firebase config
```

See `ENVIRONMENT_SETUP_GUIDE.md` in the root for complete environment setup.

## 🎨 AI Features Setup (Optional)

### AI Product Creator

To enable AI-powered product creation for admins:

```bash
# 1. Start Ollama service
docker compose up -d ollama

# 2. Pull the llava model
docker compose exec ollama ollama pull llava

# 3. Access at http://localhost:9002/admin/products/ai-create
```

**Note:** First AI analysis may take 30-40 seconds. Subsequent requests are faster.

See [AI Setup Guide](./ai-setup.md) for detailed configuration.

## 🗄️ Database Operations

Common database commands:

```bash
# Generate Prisma client
npm run db:generate

# Create/update database schema
npm run db:push

# Seed sample data
npm run db:seed

# Open Prisma Studio (visual DB editor)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (careful!)
npm run db:reset
```

For detailed database troubleshooting, see [Docker Setup Guide](./docker-setup.md).

## 🔴 Redis Setup

Redis is used for:
- WebRTC signaling for voice calls
- Real-time message delivery
- Server-Sent Events (SSE)

Basic Redis setup is included in `docker compose up`. For advanced Redis HA setup with Sentinel, see [Redis Setup Guide](./redis-setup.md).

```bash
# Basic Redis status check
docker compose ps redis

# Access Redis CLI
docker compose exec redis redis-cli
```

## 📂 Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── app/actions/      # Server actions (database logic)
├── ai/              # Genkit AI flows
├── components/      # React components
├── context/         # Global state (Cart, Chat, Voice)
├── firebase/        # Firebase authentication
├── hooks/           # Custom React hooks
└── lib/             # Utilities and database client

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations
```

## ✅ Verify Your Setup

1. **Frontend loads:** http://localhost:9002
2. **Database connection:** `npm run db:studio` opens Prisma Studio
3. **Redis working:** `docker compose exec redis redis-cli ping` returns `PONG`
4. **Ollama ready** (if enabled): `curl http://localhost:11434/`

## 🎯 Next Steps

1. **Explore the storefront:** Navigate to `http://localhost:9002`
2. **Admin panel:** Go to `/admin` (requires login with admin account)
3. **Create products:** Use `/admin/products` or `/admin/products/ai-create`
4. **Test chat:** Click the chat icon on the homepage
5. **Test voice calls:** Click the phone icon

## 📚 Further Reading

- [Docker Setup Guide](./docker-setup.md) - PostgreSQL, Redis, and other services
- [AI Setup Guide](./ai-setup.md) - Ollama and AI Product Creator
- [Redis Setup Guide](./redis-setup.md) - Redis cluster and Sentinel
- [Database Design](../architecture/database-design.md) - Schema and relationships

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find service on port 9002
lsof -i :9002
# Kill it or use different port
PORT=3000 npm run dev
```

### Docker Services Won't Start
```bash
# Check logs
docker compose logs

# Clean up and restart
docker compose down -v
docker compose up -d
```

### Database Connection Error
```bash
# Verify database is running
docker compose ps postgres

# Check connection string in .env
# Reset if needed
npm run db:reset
```

### Redis Connection Issues
```bash
# Test Redis connection
docker compose exec redis redis-cli ping

# Restart Redis
docker compose restart redis
```

## 🎓 Learning Resources

- **Architecture Overview:** See `AGENTS.md` at project root
- **Feature Documentation:** See `docs/features/` folder
- **Deployment Guide:** See `docs/deployment/` folder
- **Troubleshooting:** See `docs/troubleshooting/` folder

---

**Happy coding!** 🚀 If you encounter any issues, check the troubleshooting section or review the relevant setup guide for your specific feature.
