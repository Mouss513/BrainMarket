import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'route accessible' })
}

// POST version that mimics sync but with debug info at each step
export async function POST() {
  const steps: string[] = []
  try {
    // Step 1: Auth
    const { userId: clerkUserId } = auth()
    steps.push(`auth: ${clerkUserId || 'null'}`)
    if (!clerkUserId) {
      return NextResponse.json({ steps, error: 'No auth' }, { status: 401 })
    }

    // Step 2: Supabase user
    const supabase = createServerClient()
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()
    steps.push(`user: ${JSON.stringify(userData)}, err: ${userErr?.message || 'none'}`)

    if (!userData) {
      return NextResponse.json({ steps, error: 'No user' }, { status: 404 })
    }

    const userId = (userData as { id: string }).id

    // Step 3: Connection
    const { data: connData, error: connErr } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'shopify')
      .eq('status', 'active')
      .limit(1)

    const connSafe = connData ? (connData as Record<string, unknown>[]).map(c => ({
      shop_domain: c.shop_domain,
      has_token: !!c.access_token_encrypted,
    })) : null
    steps.push(`connections: ${JSON.stringify(connSafe)}, err: ${connErr?.message || 'none'}`)

    // Step 4: Check shopify_data table
    const { data: sdData, error: sdErr } = await (supabase.from('shopify_data') as ReturnType<typeof supabase.from>)
      .select('*')
      .limit(1)
    steps.push(`shopify_data table: ${sdErr ? sdErr.message : `ok (${(sdData || []).length} rows)`}`)

    return NextResponse.json({ steps, status: 'debug complete' })
  } catch (err) {
    steps.push(`crash: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ steps, error: 'crash' }, { status: 500 })
  }
}
