import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { nonces } from '@/lib/shopify/nonces'

// ============================================================
// GET /api/meta/auth
// Redirects to Meta OAuth authorization page
// ============================================================

const SCOPES = 'ads_read,ads_management,business_management'

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const appId = process.env.META_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'META_APP_ID non configurée' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/meta/callback`

  // Generate nonce for CSRF protection (reuse the same nonce store as Shopify)
  const nonce = randomBytes(16).toString('hex')
  nonces.set(nonce, {
    clerkUserId: userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })

  const authUrl =
    `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&state=${nonce}` +
    `&response_type=code`

  return NextResponse.redirect(authUrl)
}
