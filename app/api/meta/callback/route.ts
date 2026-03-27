import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { nonces } from '@/lib/shopify/nonces'

// ============================================================
// GET /api/meta/callback?code=...&state=...
// Exchanges code for access token and stores in Supabase
// ============================================================

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams
  const code = query.get('code')
  const state = query.get('state')
  const error = query.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // User denied access
  if (error) {
    console.error('[meta/callback] User denied access:', error)
    return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=access_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=missing_params`)
  }

  // Verify nonce (CSRF)
  const nonceData = nonces.get(state)
  if (!nonceData || nonceData.expiresAt < Date.now()) {
    nonces.delete(state)
    console.error('[meta/callback] Nonce invalid or expired')
    return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=nonce_expired`)
  }
  const clerkUserId = nonceData.clerkUserId
  nonces.delete(state)

  // Exchange code for access token
  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${appUrl}/api/meta/callback`

  let accessToken: string
  try {
    const tokenUrl =
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`

    const tokenRes = await fetch(tokenUrl)
    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[meta/callback] Token exchange failed:', body)
      return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=token_exchange`)
    }

    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token
  } catch (err) {
    console.error('[meta/callback] Token exchange error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=token_exchange`)
  }

  // Exchange for long-lived token (60 days instead of ~1 hour)
  try {
    const longLivedUrl =
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${encodeURIComponent(accessToken)}`

    const llRes = await fetch(longLivedUrl)
    if (llRes.ok) {
      const llData = await llRes.json()
      accessToken = llData.access_token
      console.log('[meta/callback] Got long-lived token')
    }
  } catch {
    console.log('[meta/callback] Long-lived token exchange failed, using short-lived')
  }

  // Encrypt token
  const encryptedToken = encrypt(accessToken)

  // Find or create user in Supabase
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
    console.log(`[meta/callback] User not found for clerk_id ${clerkUserId}, creating...`)
    let email = 'unknown@brainmarket.app'
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkUserId)
      email = clerkUser.emailAddresses?.[0]?.emailAddress || email
    } catch (err) {
      console.error('[meta/callback] Failed to fetch Clerk user:', err)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: insertError } = await (supabase.from('users') as any)
      .insert({ clerk_id: clerkUserId, email })
      .select('id')
      .single()

    if (insertError || !newUser) {
      console.error('[meta/callback] Failed to create user:', insertError)
      return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=user_creation_failed`)
    }
    userId = (newUser as { id: string }).id
  }

  // Upsert connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase.from('connections') as any)
    .upsert(
      {
        user_id: userId,
        platform: 'meta',
        shop_domain: null,
        access_token_encrypted: encryptedToken,
        scopes: 'ads_read,ads_management,business_management',
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform,shop_domain' }
    )

  if (upsertError) {
    console.error('[meta/callback] Upsert error:', upsertError)
    return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=error&reason=db_error`)
  }

  console.log(`[meta/callback] Connected Meta Ads for user ${userId}`)
  return NextResponse.redirect(`${appUrl}/dashboard/connections?meta=connected`)
}
