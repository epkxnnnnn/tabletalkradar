# TableTalk Radar - Comprehensive Refactoring Plan

## Executive Summary
Current state: 67+ files cluttered in root directory, 25+ SQL files, mixed configurations, and no clear organization.
Target: Modern, scalable Next.js architecture with clear separation of concerns.

## 1. Directory Restructure

### Current Issues:
- 25+ SQL migration files scattered in root
- 15+ markdown documentation files mixed with code
- Configuration files (.env, docker, etc.) mixed with source
- Test files spread across multiple locations
- No clear separation between tools, docs, and source code

### New Directory Structure:
```
tabletalk/
├── docs/                           # All documentation
│   ├── setup/                      # Setup guides
│   ├── api/                        # API documentation
│   ├── deployment/                 # Deployment guides
│   └── architecture/               # Technical docs
├── tools/                          # Development tools
│   ├── scripts/                    # Utility scripts
│   ├── migrations/                 # Database migrations
│   └── seeders/                    # Data seeders
├── config/                         # Configuration files
│   ├── docker/                     # Docker configs
│   ├── deployment/                 # Deployment configs
│   └── environments/               # Environment configs
├── database/                       # Database related files
│   ├── migrations/                 # Versioned migrations
│   ├── seeds/                      # Seed data
│   └── schema/                     # Schema definitions
├── src/                           # Source code (existing structure improved)
├── tests/                         # All test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── public/                        # Static assets
└── [config files at root]         # Essential configs only
```

## 2. File Reorganization Commands

### Step 1: Create New Directory Structure
```bash
# Create main directories
mkdir -p docs/{setup,api,deployment,architecture}
mkdir -p tools/{scripts,migrations,seeders}
mkdir -p config/{docker,deployment,environments}
mkdir -p database/{migrations,seeds,schema}
mkdir -p tests/{unit,integration,e2e,fixtures}

# Create subdirectories
mkdir -p docs/setup/{initial,google-oauth,supabase}
mkdir -p docs/deployment/{production,development,docker}
mkdir -p tools/scripts/{import,export,maintenance}
```

### Step 2: Move Documentation Files
```bash
# Setup documentation
mv GITHUB_SETUP.md docs/setup/
mv GOOGLE_OAUTH_SETUP.md docs/setup/
mv CLIENT_DATA_IMPORT_GUIDE.md docs/setup/
mv CLAUDE.md docs/setup/

# Deployment documentation  
mv DEPLOYMENT.md docs/deployment/
mv deployment-working.md docs/deployment/
mv INFRASTRUCTURE.md docs/deployment/

# Architecture documentation
mv PRD.md docs/architecture/
mv AGENCY_PLATFORM_DOCS.md docs/architecture/
mv QA-tabletalk.md docs/architecture/
mv test-gmb-setup.md docs/architecture/

# Keep README.md at root but clean it up
```

### Step 3: Move and Organize SQL Files
```bash
# Move migration files to database/migrations with proper naming
mv complete-migration-ordered.sql database/migrations/001_initial_schema.sql
mv create_tables_step1.sql database/migrations/002_core_tables.sql
mv create_tables_step2.sql database/migrations/003_additional_tables.sql
mv essential-migration.sql database/migrations/004_essential_features.sql
mv fixed-migration.sql database/migrations/005_bug_fixes.sql
mv safe-migration.sql database/migrations/006_safe_updates.sql

# Move feature-specific migrations
mv create_client_users_system.sql database/migrations/007_client_users.sql
mv create_google_business_features.sql database/migrations/008_gmb_features.sql
mv create_multi_location_system.sql database/migrations/009_multi_location.sql
mv create_reviews_table.sql database/migrations/010_reviews.sql
mv create_social_media_posts_table.sql database/migrations/011_social_media.sql

# Move data migrations
mv import-clients-correct.sql database/seeds/001_client_data.sql
mv ADD_SAMPLE_DATA.sql database/seeds/002_sample_data.sql
mv step2_add_sample_data.sql database/seeds/003_additional_samples.sql

# Move utility/fix scripts to tools
mv fix_*.sql tools/scripts/maintenance/
mv check_*.sql tools/scripts/maintenance/
mv cleanup_*.sql tools/scripts/maintenance/
```

### Step 4: Move Configuration Files
```bash
# Docker configuration
mv Dockerfile config/docker/
mv docker-compose.yml config/docker/
mv docker-compose.override.yml config/docker/

# Deployment configuration
mv vercel.json config/deployment/
mv deploy.sh tools/scripts/

# Keep at root: package.json, next.config.js, tailwind.config.js, tsconfig.json
```

### Step 5: Move and Organize Scripts
```bash
# Import/export scripts
mv import-clients.js tools/scripts/import/
mv scripts/import-clients.js tools/scripts/import/client-importer.js
mv check_duplicates.js tools/scripts/maintenance/
mv remove_duplicates.js tools/scripts/maintenance/
mv fix_client_agencies.js tools/scripts/maintenance/

# Test and debug scripts
mv test-qwen3.js tools/scripts/
mv test_client_analyzer_flow.js tools/scripts/
mv debug-session.md docs/development/
```

### Step 6: Reorganize Tests
```bash
# Move existing tests to proper structure
mv __tests__/* tests/
rmdir __tests__

# Organize test files
mv tests/integration/* tests/integration/
mv tests/unit/* tests/unit/
mv tests/smoke/* tests/e2e/

# Move jest configuration
mv jest.setup.js tests/setup.js
```

## 3. Database Migration System

### Create Migration Runner Script
```bash
# Create tools/scripts/migrate.js
```

### Consolidate Migration Files
- Combine related migrations
- Add proper versioning (001, 002, etc.)
- Include rollback scripts
- Add migration metadata

### Migration Naming Convention
```
database/migrations/
├── 001_initial_schema.sql
├── 002_core_tables.sql
├── 003_client_management.sql
├── 004_google_business_integration.sql
├── 005_multi_location_support.sql
├── 006_reviews_and_social.sql
├── 007_rls_policies.sql
└── 008_performance_indexes.sql
```

## 4. Source Code Architecture Improvements

### Current Issues in src/:
- 50+ components with unclear organization
- Mixed concerns (auth, business, UI components)
- No clear component hierarchy
- API routes lack organization
- Missing TypeScript strict mode
- No consistent error handling patterns

### Proposed src/ Reorganization:
```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group
│   ├── (dashboard)/               # Dashboard route group  
│   ├── (public)/                  # Public route group
│   ├── api/                       # API routes (restructured)
│   └── globals.css
├── components/                    # UI Components
│   ├── ui/                        # Base UI components
│   ├── forms/                     # Form components
│   ├── layouts/                   # Layout components
│   ├── features/                  # Feature-specific components
│   └── providers/                 # Context providers
├── lib/                          # Utility libraries
│   ├── api/                      # API clients
│   ├── auth/                     # Authentication logic
│   ├── database/                 # Database utilities
│   ├── integrations/             # Third-party integrations
│   └── utils/                    # General utilities
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript definitions
├── constants/                    # Application constants
└── middleware.ts                 # Next.js middleware
```

### API Routes Restructuring:
```
src/app/api/
├── auth/                         # Authentication endpoints
├── clients/                      # Client management
├── locations/                    # Location management
├── reviews/                      # Review management
├── google-business/              # GMB integration
├── analytics/                    # Analytics endpoints
├── admin/                        # Admin functions
└── health/                       # Health checks
```

## 5. Configuration Management

### Environment Configuration:
```bash
# Keep only these at root:
.env.local              # Local development (git-ignored)
.env.example           # Template for environment variables
.env.production        # Production overrides (git-ignored)

# Move others to config/environments/
config/environments/
├── development.env
├── staging.env
└── test.env
```

### Configuration Consolidation:
- Single source of truth for environment variables
- Type-safe configuration object
- Environment-specific overrides
- Validation for required variables

## 6. Code Quality Improvements

### TypeScript Enhancements:
```typescript
// Strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Component Organization:
```typescript
// Feature-based component organization
components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
├── features/
│   ├── auth/
│   │   ├── AuthProvider/
│   │   ├── LoginForm/
│   │   └── SignupForm/
│   ├── clients/
│   │   ├── ClientDashboard/
│   │   ├── ClientManager/
│   │   └── ClientProvider/
```

### Error Handling Pattern:
```typescript
// Consistent error handling
export const handleApiError = (error: unknown): ApiError => {
  // Standardized error handling
}

// Result pattern for API responses
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }
```

## 7. Testing Structure

### Test Organization:
```
tests/
├── unit/                         # Unit tests
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── utils/
├── integration/                  # Integration tests
│   ├── api/
│   ├── auth/
│   └── database/
├── e2e/                         # End-to-end tests
│   ├── auth-flow/
│   ├── client-management/
│   └── google-business/
├── fixtures/                    # Test data
└── setup.js                    # Test configuration
```

## 8. Implementation Priority

### Phase 1: File Organization (Week 1)
1. Create new directory structure
2. Move documentation files
3. Move and rename SQL migrations
4. Move configuration files
5. Update import paths

### Phase 2: Database Migrations (Week 1)
1. Create migration runner script
2. Consolidate and version migrations
3. Add rollback capability
4. Test migration system

### Phase 3: Source Code Refactoring (Week 2)
1. Reorganize components by feature
2. Extract providers and hooks
3. Improve TypeScript configuration
4. Add consistent error handling

### Phase 4: Testing & Documentation (Week 2)
1. Reorganize test files
2. Add missing tests
3. Update documentation
4. Add code quality tools

### Phase 5: Performance & Optimization (Week 3)
1. Component optimization
2. Bundle analysis
3. Database query optimization
4. Caching strategy

## 9. Next Steps

1. **Backup current codebase**: `git checkout -b backup-before-refactor`
2. **Run file reorganization script**: Execute the bash commands above
3. **Update import paths**: Use find/replace for import statements
4. **Test functionality**: Ensure nothing breaks during reorganization
5. **Implement architecture improvements**: Follow the source code restructuring plan

This refactoring will transform TableTalk Radar from a cluttered prototype into a professional, maintainable application ready for scale.