'use client'

import { useState } from 'react'
import { MOCK_CLIENTS } from '@/lib/mock-admin-data'

export default function AdminOverview() {
  const [clients, setClients] = useState(MOCK_CLIENTS)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const total = clients.length
  const active = clients.filter((c) => c.status === 'active').length
  const blocked = clients.filter((c) => c.status === 'blocked').length

  function toggleBlock(id: string) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'active' ? ('blocked' as const) : ('active' as const) }
          : c
      )
    )
  }

  function deleteClient(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id))
    setConfirmDelete(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Vue globale</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Total clients</p>
          <p className="text-3xl font-bold mt-1">{total}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Actifs</p>
          <p className="text-3xl font-bold mt-1 text-green-400">{active}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400">Bloqués</p>
          <p className="text-3xl font-bold mt-1 text-red-400">{blocked}</p>
        </div>
      </div>

      {/* Client list */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium">Inscription</th>
              <th className="px-5 py-3 font-medium">Dernière connexion</th>
              <th className="px-5 py-3 font-medium text-right">Campagnes</th>
              <th className="px-5 py-3 font-medium text-right">Revenus</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition-colors"
              >
                <td className="px-5 py-4 font-medium text-white">{c.email}</td>
                <td className="px-5 py-4">
                  {c.status === 'active' ? (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                      Actif
                    </span>
                  ) : (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      Bloqué
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-400">{formatDate(c.createdAt)}</td>
                <td className="px-5 py-4 text-gray-400">{formatDateTime(c.lastLogin)}</td>
                <td className="px-5 py-4 text-right text-gray-300">{c.campaigns}</td>
                <td className="px-5 py-4 text-right text-gray-300">
                  {c.revenue.toLocaleString('fr-FR')} €
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleBlock(c.id)}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                        c.status === 'active'
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {c.status === 'active' ? 'Bloquer' : 'Débloquer'}
                    </button>

                    {confirmDelete === c.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteClient(c.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(c.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                        title="Supprimer toutes les données (RGPD)"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
