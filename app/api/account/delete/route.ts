import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE() {
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  const supabase = createServerClient()

  // Resolve Supabase user_id
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single()

  const supabaseUserId = userRow
    ? (userRow as { id: string }).id
    : null

  if (supabaseUserId) {
    // Delete in order: recommendations, shopify_data, meta_data, connections, users
    await supabase.from('brain_recommendations').delete().eq('user_id', supabaseUserId)
    await supabase.from('shopify_data').delete().eq('user_id', supabaseUserId)
    await supabase.from('meta_data').delete().eq('user_id', supabaseUserId)
    await supabase.from('connections').delete().eq('user_id', supabaseUserId)
    await supabase.from('users').delete().eq('id', supabaseUserId)
  }

  // Delete Clerk user
  try {
    const client = await clerkClient()
    await client.users.deleteUser(clerkUserId)
  } catch (err) {
    console.error('[account/delete] Clerk delete error:', err)
    return NextResponse.json(
      { error: 'Donnees supprimees mais erreur Clerk. Contactez le support.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
