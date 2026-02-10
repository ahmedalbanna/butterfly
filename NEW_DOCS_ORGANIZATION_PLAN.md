# New Documentation Organization Plan

## Files to Organize (13 files)

### 1. Setup & Quick Start (Move to docs/setup/)
- `QUICK_START.md` → `docs/setup/auth-quick-start.md`
- `SETUP_INSTRUCTIONS.md` → `docs/setup/auth-setup.md`

### 2. Features/Authentication (Create new category or add to features)
- `POSTGRES_AUTH_MIGRATION_GUIDE.md` → `docs/features/postgresql-auth.md`
- `README_AUTH.md` → `docs/features/auth-system.md`

### 3. Testing Documentation (Move to docs/troubleshooting or create docs/testing)
- `TESTING_GUIDE.md` → `docs/testing/auth-testing.md`
- `TEST_RESULTS.md` → `docs/testing/test-results.md`

### 4. Deployment (Move to docs/deployment/)
- `DEPLOYMENT_GUIDE.md` → `docs/deployment/auth-deployment.md`

### 5. Implementation Docs (Move to docs/architecture/ or docs/implementation/)
- `IMPLEMENTATION_CHECKLIST.md` → `docs/implementation/auth-checklist.md`
- `IMPLEMENTATION_SUMMARY.md` → Already in docs/architecture/ (SKIP - consolidate if duplicate)
- `FINAL_SUMMARY.md` → Archive (consolidate with existing summaries)

### 6. Database/Tools Documentation (Move to docs/setup/ or docs/architecture/)
- `DB_MANAGER_README.md` → `docs/setup/db-manager.md`
- `DOCKER_REORGANIZATION_SUMMARY.txt` → Archive to .docs_archive/

### 7. Migration/Change Documentation (Move to docs/architecture/)
- `FIREBASE_REMOVAL_COMPLETE.md` → `docs/architecture/firebase-removal.md`
- `FIREBASE_REMOVAL_FINAL.md` → Archive (duplicate)

### 8. Cleanup (Remove temporary files)
- `cookies.txt` → DELETE (temporary)
- `cookies2.txt` → DELETE (temporary)

## Recommended Organization Strategy

Create new folders for authentication:
```
docs/
├── setup/
│   ├── auth-quick-start.md
│   ├── auth-setup.md
│   └── db-manager.md
├── features/
│   ├── postgresql-auth.md
│   └── auth-system.md
├── architecture/
│   ├── firebase-removal.md
│   └── (existing files)
├── deployment/
│   ├── auth-deployment.md
│   └── (existing files)
└── testing/ (NEW)
    ├── auth-testing.md
    └── test-results.md
```

Or if we want to keep it simpler, add a new `docs/authentication/` folder for all auth-related docs.
