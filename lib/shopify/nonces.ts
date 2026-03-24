// In-memory nonce store for Shopify OAuth CSRF protection
// In production, use Redis or a database
export const nonces = new Map<string, { clerkUserId: string; expiresAt: number }>()
