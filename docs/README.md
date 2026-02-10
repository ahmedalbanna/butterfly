# 📚 LuxeFinds Documentation

Welcome to the comprehensive documentation for **LuxeFinds** - an elite digital boutique powered by Next.js 15, Genkit AI, and PostgreSQL.

## 🚀 Quick Navigation

### Getting Started (Start Here!)
- **[Getting Started Guide](./setup/getting-started.md)** - 5-10 minute setup for development or production
- **[Docker Setup](./setup/docker-setup.md)** - PostgreSQL, Redis, Ollama configuration
- **[AI Setup](./setup/ai-setup.md)** - Ollama and AI Product Creator
- **[Redis Setup](./setup/redis-setup.md)** - Redis for signaling and real-time features

### Feature Documentation
Learn about specific LuxeFinds features:

- **[AI Stylist Chat](./features/ai-product-creator.md)** - Real-time chat with AI fashion consultant
- **[Voice Calls](./features/voice-calls.md)** - WebRTC voice calling with Redis signaling
- **[AI Product Creator](./features/ai-product-creator.md)** - Admin feature for AI-powered product creation
- **[Virtual Try-On](./features/virtual-tryon.md)** - Virtual try-on functionality
- **[Batch Upload](./features/batch-upload.md)** - Bulk product upload
- **[Checkout](./features/checkout.md)** - Checkout flow and payment processing
- **[Test Calls](./features/test-call-implementation.md)** - Test call implementation details
- **[n8n Integration](./features/n8n-integration.md)** - Workflow automation with n8n

### Authentication Documentation
PostgreSQL authentication system (replaces Firebase):

- **[Quick Start (5 min)](./authentication/quick-start.md)** - Get authentication running in 5 minutes
- **[Setup Instructions](./authentication/setup.md)** - Complete authentication setup
- **[Authentication System](./authentication/auth-system.md)** - System overview
- **[PostgreSQL Auth Migration](./authentication/postgresql-auth.md)** - Technical details
- **[Testing Guide](./authentication/testing.md)** - Test cases and verification
- **[Deployment Guide](./authentication/deployment.md)** - Production deployment
- **[Firebase Migration](./authentication/firebase-removal.md)** - Firebase to PostgreSQL migration
- **[Database Manager](./authentication/db-manager.md)** - Database management tools
- **[Implementation Checklist](./authentication/checklist.md)** - Implementation verification

### Architecture & Design
Deep dive into system architecture:

- **[System Architecture](./architecture/system-architecture.md)** - Overall system design
- **[Enterprise Architecture](./architecture/enterprise-architecture.md)** - Enterprise-level design patterns
- **[CDC Architecture](./architecture/cdc-architecture.md)** - Change Data Capture implementation
- **[Database Design](./architecture/database-design.md)** - Schema and relationships
- **[Realtime Systems](./architecture/realtime-systems.md)** - Real-time communication
- **[Communication Systems](./architecture/communication-systems.md)** - Chat and messaging

### Deployment & Operations
Production deployment and monitoring:

- **[Production Deployment](./deployment/production-deployment.md)** - Deploy to production
- **[CDC Deployment](./deployment/cdc-deployment.md)** - Change Data Capture deployment
- **[Monitoring Setup](./deployment/monitoring-setup.md)** - Prometheus & Grafana
- **[Monitoring Guide](./deployment/monitoring-guide.md)** - Operational monitoring
- **[Redis HA Setup](./deployment/redis-ha-setup.md)** - High availability configuration

### Troubleshooting & Support
Solve problems and find answers:

- **[Errors & Fixes](./troubleshooting/errors-and-fixes.md)** - Common errors and solutions
- **[Terminal Guide](./troubleshooting/terminal-guide.md)** - Useful terminal commands
- **[Common Issues](./troubleshooting/common-issues.md)** - FAQ and workarounds

### Reports & Analysis
Deployment reports and test results:

- **[Final Production Report](./reports/final-production-report.md)** - Production deployment report
- **[Redis Signaling Test Report](./reports/redis-signaling-test-report.md)** - Voice call testing results
- **[Test Call Implementation](./reports/test-call-implementation.md)** - Test implementation details

---

## 📂 Documentation Structure

```
docs/
├── README.md                          # This file
│
├── setup/                             # Getting started & installation
│   ├── getting-started.md            # Quick start guide
│   ├── docker-setup.md               # Docker services
│   ├── ai-setup.md                   # Ollama & AI features
│   └── redis-setup.md                # Redis configuration
│
├── features/                          # Feature documentation
│   ├── ai-product-creator.md         # AI-powered product creation
│   ├── voice-calls.md                # WebRTC voice calls
│   ├── virtual-tryon.md              # Virtual try-on
│   ├── batch-upload.md               # Bulk upload
│   ├── checkout.md                   # Payment & checkout
│   ├── test-call-implementation.md   # Test calls
│   └── n8n-integration.md            # Workflow automation
│
├── authentication/                    # PostgreSQL authentication
│   ├── README.md                     # Auth documentation index
│   ├── quick-start.md                # 5-minute quickstart
│   ├── setup.md                      # Complete setup guide
│   ├── auth-system.md                # System overview
│   ├── postgresql-auth.md            # Technical migration details
│   ├── testing.md                    # Testing & verification
│   ├── deployment.md                 # Production deployment
│   ├── firebase-removal.md           # Firebase migration
│   ├── db-manager.md                 # Database management
│   └── checklist.md                  # Implementation checklist
│
├── architecture/                      # System design
│   ├── system-architecture.md        # Overall design
│   ├── enterprise-architecture.md    # Enterprise patterns
│   ├── cdc-architecture.md           # Change Data Capture
│   ├── database-design.md            # Database schema
│   ├── realtime-systems.md           # Real-time updates
│   └── communication-systems.md      # Chat & messaging
│
├── deployment/                        # Production deployment
│   ├── production-deployment.md      # Deploy to prod
│   ├── cdc-deployment.md             # CDC setup
│   ├── monitoring-setup.md           # Monitoring stack
│   ├── monitoring-guide.md           # Operational guide
│   └── redis-ha-setup.md             # High availability
│
├── troubleshooting/                   # Problem solving
│   ├── errors-and-fixes.md           # Error reference
│   ├── terminal-guide.md             # CLI commands
│   └── common-issues.md              # FAQ
│
└── reports/                           # Test & deployment reports
    ├── final-production-report.md    # Deployment report
    ├── redis-signaling-test-report.md
    └── test-call-implementation.md
```

---

## 🎯 Common Scenarios

### "I want to set up LuxeFinds locally"
1. Start with [Getting Started Guide](./setup/getting-started.md)
2. Follow [Docker Setup](./setup/docker-setup.md) for database
3. Optionally enable [AI Setup](./setup/ai-setup.md)

### "I need to add a new feature"
1. Review [System Architecture](./architecture/system-architecture.md)
2. Check related feature docs in [Features](./features/)
3. Reference [Database Design](./architecture/database-design.md) if needed

### "I'm deploying to production"
1. Read [Production Deployment](./deployment/production-deployment.md)
2. Set up [Monitoring](./deployment/monitoring-setup.md)
3. For high availability: [Redis HA Setup](./deployment/redis-ha-setup.md)
4. Check [CDC Deployment](./deployment/cdc-deployment.md) for data sync

### "I encountered an error"
1. Check [Errors & Fixes](./troubleshooting/errors-and-fixes.md)
2. Search [Common Issues](./troubleshooting/common-issues.md)
3. Review logs with [Terminal Guide](./troubleshooting/terminal-guide.md)

### "I want to understand the architecture"
1. Start with [System Architecture](./architecture/system-architecture.md)
2. Deep dive: [Enterprise Architecture](./architecture/enterprise-architecture.md)
3. For real-time: [Realtime Systems](./architecture/realtime-systems.md)
4. For data: [Database Design](./architecture/database-design.md)

---

## 📚 Key Topics

### Setup & Installation
- Environment configuration
- Docker services (PostgreSQL, Redis, Ollama)
- Database initialization
- AI model setup

### Features
- Chat & messaging
- Voice calls with WebRTC
- AI-powered product creation
- Payment processing
- Admin tools

### Architecture
- Microservices design
- Database architecture
- Real-time communication
- Caching strategies
- High availability

### Operations
- Deployment procedures
- Monitoring & alerts
- Performance tuning
- Security hardening
- Backup & recovery

---

## 🔗 Related Documents

### Root Level (Critical for Onboarding)
- **[README.md](../README.md)** - Project overview and quick start
- **[AGENTS.md](../AGENTS.md)** - Critical context for AI agents
- **[ENVIRONMENT_SETUP_GUIDE.md](../ENVIRONMENT_SETUP_GUIDE.md)** - Environment variables

### Configuration Files
- **[docker-compose.yml](../docker-compose.yml)** - Docker service definitions
- **[.env.example](../.env.example)** - Environment template
- **[prisma/schema.prisma](../prisma/schema.prisma)** - Database schema

### Code Structure
- **[src/app/](../src/app/)** - Next.js pages and routes
- **[src/app/actions/](../src/app/actions/)** - Server actions
- **[src/ai/flows/](../src/ai/flows/)** - Genkit AI flows
- **[src/lib/](../src/lib/)** - Utilities and clients

---

## 🚀 Getting Help

### I'm stuck on setup
→ See [Getting Started Guide](./setup/getting-started.md) and [Docker Setup](./setup/docker-setup.md)

### I need to understand a feature
→ Browse [Feature Documentation](./features/)

### I'm fixing a bug
→ Check [Errors & Fixes](./troubleshooting/errors-and-fixes.md)

### I'm deploying to production
→ Follow [Production Deployment](./deployment/production-deployment.md)

### I want to understand the code
→ Start with [System Architecture](./architecture/system-architecture.md)

---

## 📖 Reading Guide by Role

### Frontend Developer
1. [System Architecture](./architecture/system-architecture.md)
2. [Getting Started](./setup/getting-started.md)
3. [Feature Documentation](./features/)
4. [Database Design](./architecture/database-design.md)

### Backend Developer
1. [System Architecture](./architecture/system-architecture.md)
2. [Database Design](./architecture/database-design.md)
3. [Realtime Systems](./architecture/realtime-systems.md)
4. [Architecture docs](./architecture/)

### DevOps / System Administrator
1. [Getting Started](./setup/getting-started.md)
2. [Docker Setup](./setup/docker-setup.md)
3. [Production Deployment](./deployment/production-deployment.md)
4. [Monitoring Setup](./deployment/monitoring-setup.md)

### Product Manager
1. [README (Root)](../README.md)
2. [Feature Documentation](./features/)
3. [Final Production Report](./reports/final-production-report.md)

### AI/ML Engineer
1. [AI Setup](./setup/ai-setup.md)
2. [AI Product Creator](./features/ai-product-creator.md)
3. [System Architecture](./architecture/system-architecture.md)

---

## ✨ Key Features Overview

| Feature | Doc Link | Status |
|---------|----------|--------|
| AI Stylist Chat | [Features](./features/) | ✅ Production Ready |
| Voice Calls | [Voice Calls](./features/voice-calls.md) | ✅ Production Ready |
| AI Product Creator | [AI Product Creator](./features/ai-product-creator.md) | ✅ Production Ready |
| Virtual Try-On | [Virtual Try-On](./features/virtual-tryon.md) | ✅ Production Ready |
| Batch Upload | [Batch Upload](./features/batch-upload.md) | ✅ Production Ready |
| Checkout | [Checkout](./features/checkout.md) | ✅ Production Ready |
| Monitoring | [Monitoring](./deployment/monitoring-setup.md) | ✅ Production Ready |
| High Availability | [Redis HA](./deployment/redis-ha-setup.md) | ✅ Production Ready |

---

## 🔐 Security & Compliance

Important security considerations:
- Never commit `.env` with real credentials
- Use environment variables in production
- Enable SSL/TLS for all connections
- Regular security audits
- Backup strategy
- Access control policies

See [Production Deployment](./deployment/production-deployment.md) for details.

---

## 📞 Support

For questions or issues:

1. **Check Documentation** - Most questions are answered in the docs
2. **Search Issues** - Look through existing error reports
3. **Review Logs** - Check application and service logs
4. **Terminal Guide** - Use [Terminal Guide](./troubleshooting/terminal-guide.md) for debugging

---

## 🎓 Learning Path

### Beginner (New to LuxeFinds)
1. [Getting Started Guide](./setup/getting-started.md) - 10 minutes
2. [System Architecture](./architecture/system-architecture.md) - 20 minutes
3. [Feature Documentation](./features/) - Browse 30 minutes
4. Try creating a product or making a voice call - 10 minutes

### Intermediate (Ready to develop)
1. [Docker Setup](./setup/docker-setup.md) - 15 minutes
2. [Database Design](./architecture/database-design.md) - 30 minutes
3. [Realtime Systems](./architecture/realtime-systems.md) - 20 minutes
4. Review relevant feature code - 1 hour

### Advanced (Contributing to architecture)
1. [Enterprise Architecture](./architecture/enterprise-architecture.md) - 45 minutes
2. [CDC Architecture](./architecture/cdc-architecture.md) - 30 minutes
3. [Production Deployment](./deployment/production-deployment.md) - 30 minutes
4. Review monitoring and ops - 30 minutes

---

## 📝 Documentation Standards

All documentation follows these standards:
- Clear, concise language
- Real code examples
- Troubleshooting sections
- Links to related docs
- Updated regularly

---

## 🔄 Version Info

- **Framework:** Next.js 15
- **Database:** PostgreSQL
- **Cache:** Redis 7+
- **AI:** Genkit + Ollama
- **Last Updated:** 2026-02-10

---

## 📄 License & Usage

This documentation is part of the LuxeFinds project. Follow project guidelines for contribution and usage.

---

**Happy exploring! 🚀** Start with [Getting Started Guide](./setup/getting-started.md) if you're new to LuxeFinds.
