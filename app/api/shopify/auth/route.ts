import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { nonces } from '@/lib/shopify/nonces'

// ============================================================
// GET /api/shopify/auth?shop=mon-shop.myshopify.com
// Redirige vers la page d'autorisation Shopify OAuth
// ============================================================

const SCOPES = 'read_products,read_orders,read_analytics'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const shop = req.nextUrl.searchParams.get('shop')
  if (!shop) {
    return NextResponse.json({ error: 'Paramètre shop requis' }, { status: 400 })
  }

  const apiKey = process.env.SHOPIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'SHOPIFY_API_KEY non configurée' }, { status: 500 })
  }

  // Normaliser le domaine
  const shopDomain = shop
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\.myshopify\.com$/, '')
    + '.myshopify.com'

  // Générer un nonce pour CSRF protection
  const nonce = randomBytes(16).toString('hex')
  nonces.set(nonce, {
    clerkUserId: userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/shopify/callback`

  const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
    `client_id=${apiKey}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`

  return NextResponse.redirect(authUrl)
}
