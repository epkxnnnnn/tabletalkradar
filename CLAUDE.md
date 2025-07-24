# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build production version 
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler checks

### Testing
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:smoke` - Run smoke tests only
- `npm run test:coverage` - Run tests with coverage report

### Database Operations
- `npm run migrate:dev` - Run database migrations for development
- `npm run migrate:staging` - Run database migrations for staging
- `npm run migrate:production` - Run database migrations for production
- `npm run db:backup` - Backup database
- `npm run db:restore` - Restore database

### Quality Assurance
- `npm run security:audit` - Run npm security audit
- `npm run security:scan` - Run Snyk security scan
- `npm run lighthouse` - Run Lighthouse CI for performance

### Monitoring & Deployment
- `npm run monitor:health` - Run health checks
- `npm run monitor:metrics` - Collect system metrics
- `npm run deploy:staging` - Deploy to staging environment
- `npm run deploy:production` - Deploy to production

## Architecture Overview

### Project Structure
This is a Next.js 15 application with a feature-based architecture following recent refactoring (backup-before-refactor-20250723-175212):

**New Architecture (Current):**
- `/src/app` - Next.js App Router with API routes organized under `/api/v1/`
- `/src/components/features/` - Feature-organized components (agency, analytics, audit, auth, etc.)
- `/src/components/layouts/` - Layout components (Dashboard, Sidebar, etc.)  
- `/src/components/providers/` - React context providers
- `/src/components/ui/` - Reusable UI components
- `/src/lib` - Utility libraries and configurations
- `/src/types` - TypeScript type definitions
- `/database` - Database migrations, schema, and seed files

### Key Architectural Patterns

**API Architecture:**
- Centralized error handling via `@/lib/api-handler.ts`
- Type-safe validation using Zod schemas in `@/lib/validation.ts`
- RESTful API structure under `/api/v1/` with organized endpoints:
  - `/admin/` - Administrative functions
  - `/ai/` - AI-powered features (intelligence, predictive, tasks)
  - `/analytics/` - Business analytics
  - `/audits/` - Business audit functionality
  - `/business/` - Business-related operations (agencies, Google Business)
  - `/clients/` - Client management
  - `/reports/` - Report generation
  - `/reviews/` - Review management
  - `/social/` - Social media features
  - `/system/` - System utilities and health checks
  - `/team/` - Team management

**Component Organization:**
- Feature-based component structure for maintainability
- Clear separation between UI components, business logic, and layouts
- Provider pattern for state management (AuthProvider, AgencyProvider, etc.)

**Database Architecture:**
- Supabase (PostgreSQL) with Row Level Security (RLS)
- Migration-based schema management in `/database/migrations/`
- Seed data for development in `/database/seeds/`

### Technology Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** Supabase (PostgreSQL) with RLS
- **Authentication:** Supabase Auth
- **AI Integration:** Multiple providers (Anthropic Claude, OpenAI, Google Gemini, Perplexity, Kimi)
- **Communications:** Resend (email), Twilio (SMS)
- **Monitoring:** Sentry, Vercel Analytics
- **Testing:** Jest with jsdom environment
- **Deployment:** Vercel

### Key Features
- **Multi-AI Business Intelligence:** 5-AI analysis engine with industry-specific insights
- **Universal Business Support:** Supports all business types across industries
- **Agency Management:** Multi-client dashboard for marketing agencies
- **Real-time Monitoring:** Performance tracking across digital touchpoints
- **Automated Reporting:** Email/SMS notifications and reports
- **Google Business Integration:** Location management and review handling

## Development Guidelines

### Path Aliases
- Use `@/` prefix for all imports from the `src/` directory
- Example: `import { ApiError } from '@/lib/api-handler'`

### API Development
- Use the centralized API handler pattern from `@/lib/api-handler.ts`
- Implement proper error handling with custom error classes
- Validate all inputs using Zod schemas
- Follow RESTful conventions in `/api/v1/` structure

### Component Development
- Place components in appropriate feature directories under `/src/components/features/`
- Use TypeScript for all components
- Follow the existing component patterns and naming conventions
- Implement proper error boundaries where needed

### Database Operations
- All database migrations must be placed in `/database/migrations/`
- Use descriptive naming for migration files
- Test migrations thoroughly before applying to production
- Maintain RLS policies for security

### Testing
- Write unit tests for utility functions and components
- Integration tests for API endpoints
- Use Jest with jsdom environment for React component testing
- Maintain test coverage with `npm run test:coverage`

### Security Considerations
- Never commit API keys or sensitive data
- Use environment variables for all configuration
- Implement proper authentication and authorization
- Follow RLS policies in database operations
- Validate all user inputs

### Performance
- Optimize images using Next.js Image component
- Implement proper caching strategies
- Monitor Core Web Vitals with Lighthouse
- Use React.memo and useMemo for expensive operations

## Important Notes

- The project recently underwent major refactoring - be aware that some file references may have changed
- Multi-AI integration requires proper error handling as different providers may have different response formats
- Industry-specific analysis requires understanding of business types defined in `@/lib/business-types.ts`
- All database operations should respect Row Level Security policies
- Use the monitoring commands regularly to ensure system health