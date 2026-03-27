import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { nonces } from '@/lib/shopify/nonces'

// ============================================================
// GET /api/shopify/callback?code=...&shop=...&hmac=...&state=...
// Échange le code contre un access token et stocke dans Supabase
// ============================================================

function verifyHmac(query: URLSearchParams): boolean {
  const secret = process.env.SHOPIFY_API_SECRET
  if (!secret) return false

  const hmac = query.get('hmac')
  if (!hmac) return false

  // Build message from all params except hmac
  const params = new URLSearchParams()
  query.forEach((value, key) => {
    if (key !== 'hmac') params.set(key, value)
  })
  // Sort parameters
  const entries: [string, string][] = []
  params.forEach((value, key) => entries.push([key, value]))
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  const sortedParams = new URLSearchParams(entries)
  const message = sortedParams.toString()

  const computed = createHmac('sha256', secret).update(message).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(computed))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams
  const code = query.get('code')
  const shop = query.get('shop')
  const state = query.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Validate params
  if (!code || !shop || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=missing_params`)
  }

  // Verify HMAC
  if (!verifyHmac(query)) {
    console.error('[shopify/callback] HMAC verification failed')
    return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=hmac_failed`)
  }

  // Verify nonce (CSRF)
  const nonceData = nonces.get(state)
  if (!nonceData || nonceData.expiresAt < Date.now()) {
    nonces.delete(state)
    console.error('[shopify/callback] Nonce invalid or expired')
    return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=nonce_expired`)
  }
  const clerkUserId = nonceData.clerkUserId
  nonces.delete(state)

  // Exchange code for access token
  const apiKey = process.env.SHOPIFY_API_KEY!
  const apiSecret = process.env.SHOPIFY_API_SECRET!

  let accessToken: string
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[shopify/callback] Token exchange failed:', body)
      return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=token_exchange`)
    }

    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token
  } catch (err) {
    console.error('[shopify/callback] Token exchange error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=token_exchange`)
  }

  // Encrypt token
  const encryptedToken = encrypt(accessToken)

  // Find or create user in Supabase from Clerk ID
  const supabase = createServerClient()
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  let userId: string
  const existingUser = userData as { id: string } | null

  if (existingUser) {
    userId = existingUser.id
  } else {
    // User doesn't exist in Supabase yet — create from Clerk data
    console.log(`[shopify/callback] User not found for clerk_id ${clerkUserId}, creating...`)
    let email = 'unknown@brainmarket.app'
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkUserId)
      email = clerkUser.emailAddresses?.[0]?.emailAddress || email
    } catch (err) {
      console.error('[shopify/callback] Failed to fetch Clerk user:', err)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: insertError } = await (supabase.from('users') as any)
      .insert({ clerk_id: clerkUserId, email })
      .select('id')
      .single()

    if (insertError || !newUser) {
      console.error('[shopify/callback] Failed to create user:', insertError)
      return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=user_creation_failed`)
    }
    userId = (newUser as { id: string }).id
    console.log(`[shopify/callback] Created user ${userId} for clerk_id ${clerkUserId}`)
  }

  // Upsert connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase.from('connections') as any)
    .upsert(
      {
        user_id: userId,
        platform: 'shopify',
        shop_domain: shop,
        access_token_encrypted: encryptedToken,
        scopes: 'read_products,read_orders,read_analytics',
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform,shop_domain' }
    )

  if (upsertError) {
    console.error('[shopify/callback] Upsert error:', upsertError)
    return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=error&reason=db_error`)
  }

  console.log(`[shopify/callback] Connected ${shop} for user ${userId}`)
  return NextResponse.redirect(`${appUrl}/dashboard/connections?shopify=connected`)
}
