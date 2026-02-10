# 📦 Documentation Archive

This folder contains **deprecated documentation files** that have been consolidated and reorganized into the new `docs/` folder structure.

## ℹ️ Why This Folder?

As of February 10, 2026, the LuxeFinds project transitioned to a well-organized documentation structure in the `docs/` folder. These files have been consolidated and are now available in the new structure with better organization and reduced duplication.

## 📍 Where to Find Documentation Now

**Start here:** [`docs/README.md`](../docs/README.md)

For a quick reference of where each archived file was moved, see: [`DOCUMENTATION_MIGRATION.md`](../DOCUMENTATION_MIGRATION.md)

## 📋 Archived Files (28 total)

### Setup Guides (Consolidated)
- `DATABASE_SETUP.md` → `docs/setup/docker-setup.md`
- `DOCKER_DATABASE.md` → `docs/setup/docker-setup.md`
- `ENVIRONMENT_SETUP_GUIDE.md` → `docs/setup/getting-started.md`
- `OLLAMA_SETUP.md` → `docs/setup/ai-setup.md`
- `QUICKSTART_AI_CREATOR.md` → `docs/setup/ai-setup.md`
- `REDIS_SIGNALING.md` → `docs/setup/redis-setup.md`
- `REDIS_HA_SETUP.md` → `docs/setup/redis-setup.md`

### Feature Documentation
- `AI_PRODUCT_CREATOR.md` → `docs/features/ai-product-creator.md`
- `BATCH_UPLOAD_FEATURE.md` → `docs/features/batch-upload.md`
- `CHECKOUT_IMPLEMENTATION.md` → `docs/features/checkout.md`
- `TEST_CALL_IMPLEMENTATION.md` → `docs/features/test-call-implementation.md`
- `VIRTUAL_TRYON_ADMIN_FEATURE.md` → `docs/features/virtual-tryon.md`
- `VOICE_CALL_QUICK_START.md` → `docs/features/voice-calls.md`
- `n8n.md` → `docs/features/n8n-integration.md`

### Architecture Documentation
- `CDC_IMPLEMENTATION_SUMMARY.md` → `docs/architecture/cdc-architecture.md`
- `CDC_OPTIMIZATION_SUMMARY.md` → `docs/architecture/cdc-architecture.md`
- `COMMUNICATION_SYSTEMS_SUMMARY.md` → `docs/architecture/communication-systems.md`
- `ENTERPRISE_ARCHITECTURE_REPORT.md` → `docs/architecture/enterprise-architecture.md`
- `IMPLEMENTATION_SUMMARY.md` → `docs/architecture/system-architecture.md`
- `realtime.md` → `docs/architecture/realtime-systems.md`

### Deployment & Operations
- `CDC_DEPLOYMENT_GUIDE.md` → `docs/deployment/cdc-deployment.md`
- `FINAL_PRODUCTION_REPORT.md` → `docs/reports/final-production-report.md`
- `MONITORING_GUIDE.md` → `docs/deployment/monitoring-guide.md`
- `MONITORING_SETUP.md` → `docs/deployment/monitoring-setup.md`
- `PRODUCTION_DEPLOYMENT_REPORT.md` → `docs/deployment/production-deployment.md`

### Troubleshooting
- `ERRORS.md` → `docs/troubleshooting/errors-and-fixes.md`
- `FIXES_APPLIED.md` → `docs/troubleshooting/errors-and-fixes.md`
- `TERMINAL.md` → `docs/troubleshooting/terminal-guide.md`

### Reports
- `REDIS_SIGNALING_TEST_REPORT.md` → `docs/reports/redis-signaling-test-report.md`

## 🔗 Important Links

- **New Documentation Hub:** [`docs/README.md`](../docs/README.md)
- **Migration Map:** [`DOCUMENTATION_MIGRATION.md`](../DOCUMENTATION_MIGRATION.md)
- **Setup Guides:** [`docs/setup/`](../docs/setup/)
- **Feature Docs:** [`docs/features/`](../docs/features/)
- **Architecture:** [`docs/architecture/`](../docs/architecture/)
- **Deployment:** [`docs/deployment/`](../docs/deployment/)

## 📝 How to Use This Archive

### I need an old file
1. Check this folder
2. Open the file you need
3. Note which new location it was moved to (see list above)
4. Go to the new location for the updated version

### I want to restore an old file
```bash
# Copy from archive back to root (if needed)
cp .docs_archive/OLD_FILE.md ./OLD_FILE.md
```

### Understanding the Migration

**Why archive instead of delete?**
- Preserves Git history
- Allows gradual team transition
- Prevents broken external links
- Safer for knowledge retention
- Easy to restore if needed

## ⚠️ Deprecation Notice

**These files are no longer actively maintained.** The current, updated versions are in the `docs/` folder. If you're looking for documentation, please reference:

**→ [`docs/README.md`](../docs/README.md)**

## 📊 Archive Statistics

- **Total archived files:** 28
- **Archive size:** ~348 KB
- **Archive date:** February 10, 2026
- **Consolidation rate:** 28 files → Organized into 6 categories

## ✅ Verification

All archived files have been successfully moved to this folder and consolidated into the new documentation structure. The original content is preserved, and updated versions are available in `docs/`.

---

**Last Updated:** February 10, 2026
**Status:** Complete & Verified ✅

For new documentation, see: [`docs/README.md`](../docs/README.md)
