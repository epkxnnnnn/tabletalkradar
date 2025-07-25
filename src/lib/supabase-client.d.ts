import { SupabaseClient } from '@supabase/supabase-js';

declare module '@/lib/supabase-client' {
  export const supabase: SupabaseClient;
}
