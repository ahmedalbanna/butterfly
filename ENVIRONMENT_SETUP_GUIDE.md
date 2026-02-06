# 🔧 Environment Variables Setup Guide

Complete guide for configuring all environment variables for the Butterfly Store Enterprise CDC System.

---

## 📋 Quick Start

### Step 1: Copy Example Configuration
```bash
cp .env.example .env
```

### Step 2: Update Critical Variables
Edit `.env` and update these required values:

```bash
# Database URLs (point to your PostgreSQL instances)
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
DATABASE_REPLICA_1_URL="postgresql://postgres:password@localhost:5433/postgres"
DATABASE_REPLICA_2_URL="postgresql://postgres:password@localhost:5434/postgres"

# Redis configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_secure_password"

# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
# ... other Firebase keys

# Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# Session secret
SESSION_SECRET="your_secure_random_string_here"
```

### Step 3: Verify Configuration
```bash
npm run env:validate
```

### Step 4: Start the Application
```bash
npm run dev
```

---

## 📝 Detailed Configuration by Section

### 1. Database Configuration

#### Primary Database (Writes)
```env
DATABASE_URL="postgresql://username:password@hostname:5432/database_name"
DATABASE_POOL_SIZE="20"          # Connection pool size
DATABASE_CONNECTION_TIMEOUT="5000" # Connection timeout (ms)
DATABASE_IDLE_TIMEOUT="30000"    # Idle connection timeout (ms)
```

**Example for Docker Compose:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

**Example for AWS RDS:**
```env
DATABASE_URL="postgresql://admin:password@rds-instance.c9akciq32.us-east-1.rds.amazonaws.com:5432/butterfly"
```

#### Read Replicas (Optional - for scaling reads)
```env
DATABASE_REPLICA_1_URL="postgresql://user:pass@replica1:5432/db"
DATABASE_REPLICA_2_URL="postgresql://user:pass@replica2:5432/db"
```

#### Replication Configuration
```env
DB_REPLICATION_USER="replicator"
DB_REPLICATION_PASSWORD="secure_password"
DB_REPLICATION_SLOTS="replica_1_slot,replica_2_slot"
```

---

### 2. Redis Configuration

#### Redis Sentinel Mode (High Availability - Recommended)
```env
REDIS_URL="redis://localhost:6379"
REDIS_MODE="sentinel"
REDIS_SENTINEL_HOSTS="host1:26379,host2:26380,host3:26381"
REDIS_SENTINEL_MASTER="mymaster"
REDIS_PASSWORD="your_redis_password"
```

**Docker Compose Example:**
```env
REDIS_URL="redis://localhost:6379"
REDIS_MODE="sentinel"
REDIS_SENTINEL_HOSTS="localhost:26379,localhost:26380,localhost:26381"
REDIS_SENTINEL_MASTER="mymaster"
```

**AWS ElastiCache Sentinel:**
```env
REDIS_URL="redis://primary-endpoint-1:6379"
REDIS_MODE="sentinel"
REDIS_SENTINEL_HOSTS="sentinel-1:26379,sentinel-2:26379,sentinel-3:26379"
REDIS_SENTINEL_MASTER="mymaster"
```

#### Redis Cluster Mode (Horizontal Scaling)
```env
REDIS_CLUSTER_MODE="true"
REDIS_CLUSTER_NODES="localhost:7001,localhost:7002,localhost:7003,localhost:7004,localhost:7005,localhost:7006"
REDIS_PASSWORD="your_cluster_password"
```

#### Redis Cache Settings
```env
REDIS_CACHE_ENABLED="true"
REDIS_CACHE_TTL_PRODUCT="300"      # 5 minutes
REDIS_CACHE_TTL_ORDER="30"         # 30 seconds
REDIS_CACHE_TTL_MESSAGE="10"       # 10 seconds
REDIS_CACHE_TTL_CALL="5"           # 5 seconds
```

---

### 3. CDC System Configuration

```env
# Enable CDC listener
CDC_ENABLED="true"
CDC_LISTENER_ENABLED="true"

# Reconnection settings
CDC_RECONNECT_ATTEMPTS="10"
CDC_RECONNECT_BACKOFF_MS="1000"
CDC_RECONNECT_MAX_DELAY_MS="30000"

# Tables to monitor
CDC_CHANNELS="Product,Category,Order,OrderItem,CustomerMessage,MessageReply,VoiceCallSession,ActiveChatSession,CustomOrder"

# Event store retention
EVENT_STORE_RETENTION_DAYS="90"
```

---

### 4. Cache Warming Configuration

```env
# Enable cache warming
CACHE_WARMING_ENABLED="true"
CACHE_WARMING_INTERVAL_MINUTES="60"
CACHE_WARMING_ON_STARTUP="true"

# Strategy priorities (0-100, higher = executed first)
CACHE_WARMING_STRATEGY_FEATURED_PRIORITY="100"
CACHE_WARMING_STRATEGY_CATEGORIES_PRIORITY="90"
CACHE_WARMING_STRATEGY_ORDERS_PRIORITY="80"
CACHE_WARMING_STRATEGY_TRENDING_PRIORITY="70"
CACHE_WARMING_STRATEGY_DASHBOARD_PRIORITY="60"
CACHE_WARMING_STRATEGY_CHATS_PRIORITY="50"
CACHE_WARMING_STRATEGY_PRICES_PRIORITY="40"

# Adaptive TTL
ADAPTIVE_TTL_ENABLED="true"
ADAPTIVE_TTL_HIGH_HIT_RATE="0.8"    # >80% hit rate
ADAPTIVE_TTL_MEDIUM_HIT_RATE="0.5"  # >50% hit rate
```

---

### 5. Monitoring & Observability

#### Prometheus
```env
PROMETHEUS_ENABLED="true"
PROMETHEUS_PORT="9092"
PROMETHEUS_SCRAPE_INTERVAL="15s"
PROMETHEUS_EVALUATION_INTERVAL="15s"
PROMETHEUS_RETENTION="30d"
```

#### Grafana
```env
GRAFANA_ENABLED="true"
GRAFANA_PORT="3001"
GRAFANA_ADMIN_USER="admin"
GRAFANA_ADMIN_PASSWORD="secure_password_here"
```

#### AlertManager
```env
ALERTMANAGER_ENABLED="true"
ALERTMANAGER_PORT="9093"
```

#### Metrics
```env
METRICS_ENABLED="true"
METRICS_INTERVAL_MS="60000"
```

---

### 6. Firebase Configuration

Get these from your Firebase Console (Project Settings > Service Accounts):

```env
# Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"

# Admin SDK Configuration
FIREBASE_ADMIN_SDK_KEY="path/to/serviceAccountKey.json"
```
/
**To get Firebase keys:**
1. Go to Firebase Console
2. Click "Project Settings" (gear icon)
3. Click "Service Accounts" tab
4. Generate new private key
5. Copy the values from JSON

---

### 7. AI & Genkit Configuration

#### Google Gemini API
```env
GEMINI_API_KEY="your_api_key_from_makersuite"
GEMINI_MODEL="gemini-2.5-flash"
```

**Get API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy it to `GEMINI_API_KEY`

#### Ollama (Vision AI)
```env
OLLAMA_ENABLED="true"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llava"
```

---

### 8. Security Configuration

```env
# Session secret (generate with: openssl rand -hex 32)
SESSION_SECRET="your_32_character_hex_string_here"
SESSION_TIMEOUT_MS="3600000"  # 1 hour

# Encryption (generate with: openssl rand -hex 16)
ENCRYPTION_KEY="your_32_character_encryption_key_here"
ENCRYPTION_IV="your_16_character_iv_here"

# CSRF Protection
CSRF_PROTECTION_ENABLED="true"

# Secure cookies in production
SESSION_SECURE="true"
SESSION_SAME_SITE="Lax"
```

**Generate Secure Strings:**
```bash
# Generate 32-char hex string
openssl rand -hex 32

# Generate encryption key (32 chars)
openssl rand -hex 16

# Generate IV (16 chars)
openssl rand -hex 8
```

---

### 9. Payment Configuration

#### Stripe
```env
PAYMENT_ENABLED="true"
PAYMENT_PROVIDER="stripe"

# Get from Stripe Dashboard
STRIPE_SECRET_KEY="sk_test_51Hs..."
STRIPE_PUBLISHABLE_KEY="pk_test_51Hs..."
STRIPE_WEBHOOK_SECRET="whsec_1Hs..."
```

**To get Stripe keys:**
1. Log in to Stripe Dashboard
2. Go to Developers > API Keys
3. Copy "Secret Key" and "Publishable Key"
4. Go to Webhooks > Add endpoint
5. Copy webhook signing secret

---

### 10. Email Configuration

#### SendGrid (Recommended)
```env
EMAIL_ENABLED="true"
EMAIL_PROVIDER="sendgrid"
EMAIL_FROM="noreply@butterflystore.com"

SENDGRID_API_KEY="SG.your_sendgrid_api_key"
```

#### SMTP (Gmail Example)
```env
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
```

---

### 11. Logging Configuration

```env
# Log level: error, warn, info, debug, trace
LOG_LEVEL="info"

# Log format: json or text
LOG_FORMAT="json"

# File logging
LOG_FILE_ENABLED="true"
LOG_FILE_PATH="./logs"
LOG_FILE_MAX_SIZE="10m"
LOG_FILE_MAX_FILES="5"

# Performance monitoring
PERFORMANCE_MONITORING_ENABLED="true"
SLOW_QUERY_THRESHOLD_MS="1000"
SLOW_REQUEST_THRESHOLD_MS="2000"
```

---

## 🚀 Environment-Specific Configurations

### Development Environment
```env
NODE_ENV="development"
LOG_LEVEL="debug"
DEBUG_ENABLED="true"
CORS_ORIGIN="http://localhost:3000,http://localhost:9002"
MAINTENANCE_MODE="false"
```

### Staging Environment
```env
NODE_ENV="production"
LOG_LEVEL="info"
DEBUG_ENABLED="false"
CORS_ORIGIN="https://staging.butterflystore.com"
DEPLOYMENT_ENV="staging"
```

### Production Environment
```env
NODE_ENV="production"
LOG_LEVEL="warn"
DEBUG_ENABLED="false"
CORS_ORIGIN="https://butterflystore.com"
DEPLOYMENT_ENV="production"
SESSION_SECURE="true"
CSRF_PROTECTION_ENABLED="true"
```

---

## ✅ Validation Checklist

Before starting the application, verify:

- [ ] `DATABASE_URL` points to valid PostgreSQL instance
- [ ] `REDIS_URL` points to valid Redis instance
- [ ] `GEMINI_API_KEY` is set and valid
- [ ] `FIREBASE_*` keys are from your Firebase project
- [ ] `STRIPE_*` keys are from your Stripe account
- [ ] `SESSION_SECRET` is a secure random string
- [ ] `ENCRYPTION_KEY` is 32 characters
- [ ] `ENCRYPTION_IV` is 16 characters
- [ ] Email configuration is set up
- [ ] Log directory exists and is writable
- [ ] Backup directory exists and is writable

---

## 🐛 Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Ensure password is URL-encoded
# @ in password? Use %40
# : in password? Use %3A
```

### "Cannot connect to Redis"
```bash
# Check REDIS_URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

### "Gemini API key invalid"
```bash
# Verify key format
echo $GEMINI_API_KEY

# Key should start with: AIzaSy...
# Get new key from: https://makersuite.google.com/app/apikey
```

### "Firebase initialization failed"
```bash
# Verify all Firebase keys are set
env | grep FIREBASE

# All 7 values must be present:
# NEXT_PUBLIC_FIREBASE_API_KEY
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# NEXT_PUBLIC_FIREBASE_PROJECT_ID
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
# NEXT_PUBLIC_FIREBASE_APP_ID
# FIREBASE_ADMIN_SDK_KEY
```

---

## 📚 Related Documentation

- **Complete Setup**: See `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Database Setup**: See `DATABASE_SETUP.md`
- **Redis Setup**: See `REDIS_HA_SETUP.md`
- **Monitoring**: See `MONITORING_GUIDE.md`

---

**Last Updated**: February 6, 2026  
**Version**: 2.0.0 - Enterprise Edition
