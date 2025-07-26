# Schema Mismatch Report - Clients Table

## 🔍 Analysis Summary

After analyzing the codebase, I found several mismatches between TypeScript types, API endpoints, and the Supabase database schema for the clients table.

## 📊 Schema Comparison

### 1. Database Schema (from seed files and migrations)
```sql
clients table columns:
- id (UUID)
- owner_id (UUID) - references auth.users
- business_name (TEXT)
- website (TEXT)
- phone (TEXT)
- category (TEXT)
- industry (TEXT)
- business_type (TEXT)
- google_account_id (TEXT)
- status (TEXT)
- is_agency (BOOLEAN)
- agency_id (UUID) - references clients(id)
- slug (VARCHAR) - added in migration 013
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. TypeScript ClientSchema (src/types/index.ts)
```typescript
{
  id: string
  name: string           // ❌ MISMATCH: should be business_name
  email?: string         // ❌ MISMATCH: not in database
  phone?: string         // ✅ OK
  address?: string       // ❌ MISMATCH: not in database
  agency_id: string      // ✅ OK
  owner_id: string       // ✅ OK
  created_at: string     // ✅ OK
  updated_at: string     // ✅ OK
  metadata?: Record      // ❌ MISMATCH: not in database
}
```

### 3. EnhancedClient Type (src/lib/types/agency.ts)
```typescript
{
  id: string
  agency_id: string
  user_id?: string       // ❌ MISMATCH: should be owner_id
  business_name: string  // ✅ OK
  contact_name?: string  // ❌ MISMATCH: not in database
  contact_email?: string // ❌ MISMATCH: not in database
  contact_phone?: string // ❌ MISMATCH: should be phone
  website?: string       // ✅ OK
  industry?: string      // ✅ OK
  location?: string      // ❌ MISMATCH: not in database
  client_tier: string    // ✅ OK (in database)
  status: string         // ✅ OK
  // ... many other fields not in database
}
```

## 🚨 Key Issues Found

1. **Field Name Mismatches**:
   - TypeScript uses `name` vs Database uses `business_name`
   - TypeScript uses `user_id` vs Database uses `owner_id`
   - TypeScript uses `contact_phone` vs Database uses `phone`

2. **Missing Database Fields in Types**:
   - `slug` (added in migration but not in types)
   - `category`
   - `business_type`
   - `google_account_id`
   - `is_agency`

3. **Extra TypeScript Fields Not in Database**:
   - `email` / `contact_email`
   - `address`
   - `metadata`
   - `contact_name`
   - `location` (as a field, locations are in separate table)

4. **API Endpoint Issues**:
   - `/api/v1/clients` - Uses CreateClientSchema with only email and name
   - Missing slug generation in client creation
   - No proper agency_id assignment in some endpoints

## 🔧 Recommended Fixes

### 1. Update TypeScript ClientSchema
```typescript
export const ClientSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  agency_id: z.string().nullable(),
  business_name: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  google_account_id: z.string().optional(),
  status: z.string().default('active'),
  is_agency: z.boolean().default(false),
  slug: z.string().optional(),
  client_tier: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
})
```

### 2. Update API Endpoints
- Add proper validation schemas matching database
- Include slug generation on client creation
- Ensure agency_id is properly set

### 3. Database Migration Needed
```sql
-- Add missing fields that are commonly used
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT;
```

### 4. Update Client Creation API
- Generate slug automatically
- Set proper agency_id from authenticated user's agency membership
- Validate all required fields

## 📝 Action Items

1. ✅ Slug field already added to database (migration 013)
2. ❌ Update TypeScript types to match database schema
3. ❌ Fix API validation schemas
4. ❌ Add missing commonly-used fields to database
5. ❌ Update client creation logic to include slug generation