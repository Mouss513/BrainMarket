'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase/client'

type ConnectionStatus = 'active' | 'inactive'

interface Connection {
  platform: string
  status: ConnectionStatus
  shop_domain?: string
}

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

  useEffect(() => {
    if (!open) setInput('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#1e1e1e] rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-[16px] font-medium text-white tracking-[0.02em] mb-3">
          Supprimer mon compte
        </h3>
        <p className="text-[13px] text-[#888] leading-[1.6] mb-4">
          Cette action est irreversible. Toutes vos donnees seront supprimees : connexions Shopify, Meta, recommandations, historique.
        </p>
        <div className="mb-4">
          <label className="text-[11px] tracking-[0.02em] text-[#555] block mb-2">
            Tapez SUPPRIMER pour confirmer
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SUPPRIMER"
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl text-[13px] text-white placeholder-[#555] focus:outline-none focus:border-red-500/50 transition-colors duration-150"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-glass flex-1"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== 'SUPPRIMER' || deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-[13px] font-medium tracking-[0.02em] rounded-xl border border-red-500/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all duration-150 hover:-translate-y-[1px] hover:bg-red-500/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-red-500/10 disabled:active:scale-100"
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

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [connections, setConnections] = useState<Connection[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('connections')
      .select('platform, status, shop_domain')
      .eq('status', 'active')

    if (data) {
      setConnections(data as Connection[])
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

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

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-[22px] font-medium tracking-[0.02em] text-white">Profil</h2>
        <p className="text-[13px] text-[#888] mt-2 leading-[1.6]">
          Gerez votre compte et vos connexions.
        </p>
      </div>

      {/* Account info */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 mb-4">
        <h3 className="text-[11px] tracking-[0.02em] text-[#888] mb-4">Compte</h3>
        {isLoaded && user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#c8a97e]/10 flex items-center justify-center">
                  <span className="text-[#c8a97e] text-lg font-medium">
                    {(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || '?').toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-[14px] font-medium text-white tracking-[0.02em]">
                  {user.fullName || 'Utilisateur'}
                </p>
                <p className="text-[13px] text-[#888]">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1e1e1e]">
              <div>
                <p className="text-[11px] tracking-[0.02em] text-[#555]">Membre depuis</p>
                <p className="text-[13px] text-white mt-1">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.02em] text-[#555]">ID</p>
                <p className="text-[13px] text-[#888] mt-1 font-mono text-[11px]">
                  {user.id.slice(0, 16)}…
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-16 bg-[#0a0a0a] rounded-xl animate-pulse" />
        )}
      </div>

      {/* Active connections */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-6 mb-4">
        <h3 className="text-[11px] tracking-[0.02em] text-[#888] mb-4">Connexions actives</h3>
        <div className="space-y-3">
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
                  <p className="text-[11px] text-[#555]">{shopify.shop_domain}</p>
                )}
              </div>
            </div>
            <span className={`flex items-center gap-1.5 text-[12px] ${shopify ? 'text-green-400' : 'text-[#555]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${shopify ? 'bg-green-500' : 'bg-[#555]'}`} />
              {shopify ? 'Connecte' : 'Non connecte'}
            </span>
          </div>
          <div className="border-t border-[#1e1e1e]" />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <p className="text-[13px] text-white">Meta Ads</p>
            </div>
            <span className={`flex items-center gap-1.5 text-[12px] ${meta ? 'text-green-400' : 'text-[#555]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta ? 'bg-green-500' : 'bg-[#555]'}`} />
              {meta ? 'Connecte' : 'Non connecte'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111] border border-red-500/10 rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.02em] text-red-400/80 mb-2">Zone dangereuse</h3>
        <p className="text-[13px] text-[#888] leading-[1.6] mb-4">
          La suppression du compte est permanente. Toutes les donnees, connexions et recommandations seront perdues.
        </p>
        {deleteError && (
          <div className="mb-4 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <p className="text-[13px] text-red-400 leading-[1.6]">{deleteError}</p>
          </div>
        )}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-[13px] font-medium tracking-[0.02em] rounded-xl border border-red-500/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all duration-150 hover:-translate-y-[1px] hover:bg-red-500/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] active:translate-y-0 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Supprimer mon compte
        </button>
      </div>

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
      />
    </div>
  )
}
