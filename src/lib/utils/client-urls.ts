/**
 * Generate client dashboard URL
 */
export function getClientDashboardUrl(clientSlug: string): string {
  return `/clients/${clientSlug}`
}

/**
 * Generate client-specific feature URLs
 */
export function getClientFeatureUrl(clientSlug: string, feature: string): string {
  return `/clients/${clientSlug}/${feature}`
}

/**
 * Check if current path is a client dashboard
 */
export function isClientDashboard(pathname: string): boolean {
  return pathname.startsWith('/clients/')
}

/**
 * Extract client slug from pathname
 */
export function extractClientSlug(pathname: string): string | null {
  const match = pathname.match(/^\/clients\/([^\/]+)/)
  return match ? match[1] : null
}

/**
 * Generate a slug from business name
 */
export function generateClientSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}