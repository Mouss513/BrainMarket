'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Connection {
  platform: string
  status: string
  shop_domain?: string
}

interface UserPreferences {
  target_countries: string[]
  sector: string
  reference_sectors: string[]
}

// ── Country hierarchy ─────────────────────────────────────────
const CONTINENTS: { label: string; countries: { code: string; label: string }[] }[] = [
  {
    label: 'Europe',
    countries: [
      { code: 'FR', label: 'France' },
      { code: 'BE', label: 'Belgique' },
      { code: 'CH', label: 'Suisse' },
      { code: 'DE', label: 'Allemagne' },
      { code: 'ES', label: 'Espagne' },
      { code: 'IT', label: 'Italie' },
      { code: 'UK', label: 'Royaume-Uni' },
      { code: 'NL', label: 'Pays-Bas' },
      { code: 'PT', label: 'Portugal' },
    ],
  },
  {
    label: 'Amerique du Nord',
    countries: [
      { code: 'US', label: 'Etats-Unis' },
      { code: 'CA', label: 'Canada' },
      { code: 'MX', label: 'Mexique' },
    ],
  },
  {
    label: 'Asie',
    countries: [
      { code: 'JP', label: 'Japon' },
      { code: 'KR', label: 'Coree du Sud' },
      { code: 'CN', label: 'Chine' },
      { code: 'SG', label: 'Singapour' },
    ],
  },
  {
    label: 'Oceanie',
    countries: [
      { code: 'AU', label: 'Australie' },
      { code: 'NZ', label: 'Nouvelle-Zelande' },
    ],
  },
]

const ALL_COUNTRY_CODES = CONTINENTS.flatMap(c => c.countries.map(co => co.code))

// ── Sectors with emojis ───────────────────────────────────────
const REFERENCE_SECTORS = [
  { id: 'Streetwear', emoji: '🧢', label: 'Streetwear' },
  { id: 'Mode premium', emoji: '👔', label: 'Mode premium' },
  { id: 'Sneakers', emoji: '👟', label: 'Sneakers' },
  { id: 'Art urbain', emoji: '🎨', label: 'Art urbain' },
  { id: 'Lifestyle', emoji: '✨', label: 'Lifestyle' },
  { id: 'Beauté', emoji: '💄', label: 'Beaute' },
  { id: 'Sport', emoji: '⚽', label: 'Sport' },
  { id: 'Tech', emoji: '💻', label: 'Tech' },
  { id: 'Musique', emoji: '🎵', label: 'Musique' },
  { id: 'Décoration', emoji: '🏠', label: 'Decoration' },
  { id: 'Gastronomie', emoji: '🍽️', label: 'Gastronomie' },
  { id: 'Voyage', emoji: '✈️', label: 'Voyage' },
]

// ── Disconnect confirmation modal ──────────────────────────────
function DisconnectModal({
  open,
  platform,
  onClose,
  onConfirm,
}: {
  open: boolean
  platform: string
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0c0c10] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-[16px] font-medium text-white tracking-[0.02em] mb-3">
          Deconnecter {platform}
        </h3>
        <p className="text-[13px] text-white/50 leading-[1.6] mb-5">
          Les donnees deja synchronisees resteront disponibles. Vous pourrez reconnecter a tout moment.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-glass flex-1">Annuler</button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-[13px] font-medium tracking-[0.02em] rounded-full border border-red-500/20 backdrop-blur-md transition-all duration-200 hover:bg-red-500/20 active:scale-[0.96]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            Deconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete account modal ───────────────────────────────────────
function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  const [input, setInput] = useState('')
  useEffect(() => { if (!open) setInput('') }, [open])
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0c0c10] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-[16px] font-medium text-white tracking-[0.02em] mb-3">
          Supprimer mon compte
        </h3>
        <p className="text-[13px] text-white/50 leading-[1.6] mb-4">
          Cette action est irreversible. Toutes vos donnees seront supprimees : connexions Shopify, Meta, recommandations, historique.
        </p>
        <div className="mb-4">
          <label className="text-[11px] uppercase tracking-widest text-white/30 block mb-2">
            Tapez SUPPRIMER pour confirmer
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SUPPRIMER"
            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors duration-200"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-glass flex-1">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={input !== 'SUPPRIMER' || deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-[13px] font-medium tracking-[0.02em] rounded-full border border-red-500/20 backdrop-blur-md transition-all duration-200 hover:bg-red-500/20 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {deleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Suppression…
              </>
            ) : (
              'Supprimer definitivement'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  // Connections
  const [connections, setConnections] = useState<Connection[]>([])
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null)

  // Email editing
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Preferences
  const [prefs, setPrefs] = useState<UserPreferences>({ target_countries: ['FR'], sector: 'Streetwear', reference_sectors: ['Streetwear'] })
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('connections')
      .select('platform, status, shop_domain')
      .eq('status', 'active')
    if (data) setConnections(data as Connection[])
  }, [])

  const fetchPreferences = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('user_preferences')
      .select('target_countries, sector, reference_sectors')
      .limit(1)
    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data[0] as any
      setPrefs({
        target_countries: row.target_countries || ['FR'],
        sector: row.sector || 'Streetwear',
        reference_sectors: row.reference_sectors || ['Streetwear'],
      })
    }
  }, [])

  useEffect(() => {
    fetchConnections()
    fetchPreferences()
  }, [fetchConnections, fetchPreferences])

  // ── Email update via Clerk ─────────────────────────────────
  async function handleEmailSave() {
    if (!user || !newEmail.trim()) return
    setEmailSaving(true)
    setEmailError(null)
    setEmailSuccess(false)
    try {
      const created = await user.createEmailAddress({ email: newEmail.trim() })
      await created.prepareVerification({ strategy: 'email_code' })
      setEmailSuccess(true)
      setEditingEmail(false)
      setNewEmail('')
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setEmailSaving(false)
    }
  }

  // ── Disconnect platform ────────────────────────────────────
  async function handleDisconnect() {
    if (!supabase || !disconnectTarget) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('connections')
      .update({ status: 'inactive' })
      .eq('platform', disconnectTarget)
      .eq('status', 'active')
    setDisconnectTarget(null)
    fetchConnections()
  }

  // ── Save preferences ──────────────────────────────────────
  async function handleSavePrefs() {
    if (!supabase) return
    setPrefsSaving(true)
    setPrefsSaved(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert(
        {
          target_countries: prefs.target_countries,
          sector: prefs.sector,
          reference_sectors: prefs.reference_sectors,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (!error) setPrefsSaved(true)
    setPrefsSaving(false)
    setTimeout(() => setPrefsSaved(false), 3000)
  }

  function toggleCountry(code: string) {
    setPrefs(prev => {
      const has = prev.target_countries.includes(code)
      return {
        ...prev,
        target_countries: has
          ? prev.target_countries.filter(c => c !== code)
          : [...prev.target_countries, code],
      }
    })
  }

  function toggleContinent(continentLabel: string) {
    const continent = CONTINENTS.find(c => c.label === continentLabel)
    if (!continent) return
    const codes = continent.countries.map(c => c.code)
    setPrefs(prev => {
      const allSelected = codes.every(c => prev.target_countries.includes(c))
      if (allSelected) {
        return { ...prev, target_countries: prev.target_countries.filter(c => !codes.includes(c)) }
      } else {
        const merged = new Set([...prev.target_countries, ...codes])
        return { ...prev, target_countries: Array.from(merged) }
      }
    })
  }

  function toggleWorld() {
    setPrefs(prev => {
      const allSelected = ALL_COUNTRY_CODES.every(c => prev.target_countries.includes(c))
      return { ...prev, target_countries: allSelected ? [] : [...ALL_COUNTRY_CODES] }
    })
  }

  function toggleSector(sectorId: string) {
    setPrefs(prev => {
      const has = prev.reference_sectors.includes(sectorId)
      if (has) {
        return { ...prev, reference_sectors: prev.reference_sectors.filter(s => s !== sectorId) }
      }
      if (prev.reference_sectors.length >= 5) return prev
      return { ...prev, reference_sectors: [...prev.reference_sectors, sectorId] }
    })
  }

  const isWorldSelected = ALL_COUNTRY_CODES.every(c => prefs.target_countries.includes(c))
  function isContinentSelected(label: string) {
    const continent = CONTINENTS.find(c => c.label === label)
    return continent ? continent.countries.every(c => prefs.target_countries.includes(c.code)) : false
  }
  function isContinentPartial(label: string) {
    const continent = CONTINENTS.find(c => c.label === label)
    if (!continent) return false
    const some = continent.countries.some(c => prefs.target_countries.includes(c.code))
    const all = continent.countries.every(c => prefs.target_countries.includes(c.code))
    return some && !all
  }

  // ── Delete account ─────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/'
      } else {
        const body = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        setDeleteError(body.error || 'Erreur lors de la suppression')
        setDeleting(false)
      }
    } catch {
      setDeleteError('Erreur reseau')
      setDeleting(false)
    }
  }

  const shopify = connections.find(c => c.platform === 'shopify')
  const meta = connections.find(c => c.platform === 'meta')

  // Active chip style helper
  const chipActive = 'bg-white/[0.1] border-white/[0.25] text-white'
  const chipActivePartial = 'bg-white/[0.05] border-white/[0.15] text-white/70'
  const chipInactive = 'bg-transparent border-white/[0.08] text-white/30 hover:border-white/[0.15] hover:text-white/50'
  const chipDisabled = 'bg-transparent border-white/[0.04] text-white/15 cursor-not-allowed'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="font-display text-[28px] text-white">Profil</h2>
        <p className="text-[13px] text-white/50 mt-2 leading-[1.6]">
          Gerez votre compte, connexions et preferences.
        </p>
      </div>

      {/* ── Account info ─────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4 backdrop-blur-sm">
        <h3 className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Informations du compte</h3>
        {isLoaded && user ? (
          <div className="space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || '?').toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-[14px] font-medium text-white tracking-[0.02em]">
                  {user.fullName || 'Utilisateur'}
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Membre depuis {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            {/* Email row */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/30">Email</p>
                  <p className="text-[13px] text-white mt-1">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
                {!editingEmail && (
                  <button
                    onClick={() => { setEditingEmail(true); setNewEmail(''); setEmailError(null); setEmailSuccess(false) }}
                    className="btn-glass text-[12px] px-3 py-1.5"
                  >
                    Modifier
                  </button>
                )}
              </div>

              {editingEmail && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nouveau@email.com"
                    className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-full text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.2] transition-colors duration-200"
                    autoFocus
                  />
                  <button
                    onClick={handleEmailSave}
                    disabled={emailSaving || !newEmail.trim()}
                    className="btn-primary text-[12px] px-3 py-1.5"
                  >
                    {emailSaving ? '...' : 'Sauver'}
                  </button>
                  <button
                    onClick={() => { setEditingEmail(false); setEmailError(null) }}
                    className="btn-glass text-[12px] px-3 py-1.5"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {emailError && (
                <p className="text-[12px] text-red-400 mt-2">{emailError}</p>
              )}
              {emailSuccess && (
                <p className="text-[12px] text-green-400 mt-2">Un email de verification a ete envoye a votre nouvelle adresse.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-20 bg-white/[0.02] rounded-2xl animate-pulse" />
        )}
      </div>

      {/* ── Connections ───────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4 backdrop-blur-sm">
        <h3 className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Connexions</h3>
        <div className="space-y-3">
          {/* Shopify */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#96bf48]/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#96bf48]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.34 3.38c-.09-.04-.18-.01-.24.05-.06.06-1.16 1.41-1.28 1.55-.29-.7-.8-1.35-1.7-1.35h-.08c-.25-.3-.56-.45-.84-.45-2.08 0-3.08 2.6-3.39 3.92-.81.25-1.38.43-1.45.45-.45.14-.46.15-.52.58-.05.32-1.22 9.38-1.22 9.38L12.23 19l5.42-1.17S15.44 3.46 15.43 3.42c0-.01-.04-.03-.09-.04z"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-white">Shopify</p>
                {shopify?.shop_domain && (
                  <p className="text-[11px] text-white/30">{shopify.shop_domain}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {shopify ? (
                <>
                  <span className="flex items-center gap-1.5 text-[12px] text-green-400 mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Connecte
                  </span>
                  <Link href="/dashboard/connections" className="btn-glass text-[12px] px-3 py-1.5">
                    Modifier
                  </Link>
                  <button
                    onClick={() => setDisconnectTarget('shopify')}
                    className="text-[12px] text-white/30 hover:text-red-400 transition-colors duration-200 px-2 py-1.5"
                  >
                    Deconnecter
                  </button>
                </>
              ) : (
                <Link href="/dashboard/connections" className="btn-primary text-[12px] px-3 py-1.5">
                  Connecter
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.06]" />

          {/* Meta */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <p className="text-[13px] text-white">Meta Ads</p>
            </div>
            <div className="flex items-center gap-2">
              {meta ? (
                <>
                  <span className="flex items-center gap-1.5 text-[12px] text-green-400 mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Connecte
                  </span>
                  <a href="/api/meta/auth" className="btn-glass text-[12px] px-3 py-1.5">
                    Reconnecter
                  </a>
                  <button
                    onClick={() => setDisconnectTarget('meta')}
                    className="text-[12px] text-white/30 hover:text-red-400 transition-colors duration-200 px-2 py-1.5"
                  >
                    Deconnecter
                  </button>
                </>
              ) : (
                <a href="/api/meta/auth" className="btn-primary text-[12px] px-3 py-1.5">
                  Connecter
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Preferences ──────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-4 backdrop-blur-sm">
        <h3 className="text-[11px] uppercase tracking-widest text-white/40 mb-4">Preferences Market Brain</h3>

        {/* Target countries — hierarchical */}
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-widest text-white/30 mb-3">Pays cibles</p>

          {/* World toggle */}
          <button
            onClick={toggleWorld}
            className={`px-4 py-2 rounded-full text-[12px] tracking-[0.02em] border transition-all duration-200 active:scale-[0.96] mb-3 ${
              isWorldSelected ? chipActive : chipInactive
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            Monde entier
          </button>

          {/* Continents */}
          <div className="space-y-3">
            {CONTINENTS.map(continent => (
              <div key={continent.label}>
                <button
                  onClick={() => toggleContinent(continent.label)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-widest uppercase border transition-all duration-200 active:scale-[0.96] mb-2 ${
                    isContinentSelected(continent.label)
                      ? chipActive
                      : isContinentPartial(continent.label)
                        ? chipActivePartial
                        : chipInactive
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {continent.label}
                </button>
                <div className="flex flex-wrap gap-1.5 ml-1">
                  {continent.countries.map(c => {
                    const active = prefs.target_countries.includes(c.code)
                    return (
                      <button
                        key={c.code}
                        onClick={() => toggleCountry(c.code)}
                        className={`px-2.5 py-1 rounded-full text-[11px] tracking-[0.02em] border transition-all duration-200 active:scale-[0.96] ${
                          active ? chipActive : chipInactive
                        }`}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reference sectors — multi-select chips */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-widest text-white/30">Secteurs de reference</p>
            <span className="text-[10px] text-white/20">{prefs.reference_sectors.length}/5</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {REFERENCE_SECTORS.map(s => {
              const active = prefs.reference_sectors.includes(s.id)
              const isDisabled = !active && prefs.reference_sectors.length >= 5
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSector(s.id)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-full text-[12px] tracking-[0.02em] border transition-all duration-200 active:scale-[0.96] ${
                    active
                      ? chipActive
                      : isDisabled
                        ? chipDisabled
                        : chipInactive
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {s.emoji} {s.label}
                </button>
              )
            })}
          </div>
          {prefs.reference_sectors.length === 0 && (
            <p className="text-[11px] text-red-400/80 mt-2">Selectionnez au moins 1 secteur</p>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSavePrefs}
            disabled={prefsSaving || prefs.reference_sectors.length === 0}
            className="btn-primary text-[12px]"
          >
            {prefsSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {prefsSaved && (
            <span className="text-[12px] text-green-400">Preferences sauvegardees</span>
          )}
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────── */}
      <div className="bg-white/[0.03] border border-red-500/10 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-[11px] uppercase tracking-widest text-red-400/80 mb-2">Zone dangereuse</h3>
        <p className="text-[13px] text-white/50 leading-[1.6] mb-4">
          La suppression du compte est permanente. Toutes les donnees, connexions et recommandations seront perdues.
        </p>
        {deleteError && (
          <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-2xl">
            <p className="text-[13px] text-red-400 leading-[1.6]">{deleteError}</p>
          </div>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-[13px] font-medium tracking-[0.02em] rounded-full border border-red-500/20 backdrop-blur-md transition-all duration-200 hover:bg-red-500/20 active:scale-[0.96]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Supprimer mon compte
        </button>
      </div>

      {/* Modals */}
      <DisconnectModal
        open={!!disconnectTarget}
        platform={disconnectTarget === 'shopify' ? 'Shopify' : 'Meta Ads'}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleDisconnect}
      />
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
      />
    </div>
  )
}
