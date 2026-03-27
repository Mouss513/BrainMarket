import Anthropic from '@anthropic-ai/sdk'
import { collectClientData } from './client-collector'
import { validateRecommendations } from './validator'
import { createServerClient } from '@/lib/supabase/server'
import type { ClientData, GlobalInsight, BrainRecommendation } from './types'

// ============================================================
// Client Brain — Recommandations personnalisées par client
// Croise données client + insights Global Brain via Claude API
// ============================================================

const MODEL = 'claude-sonnet-4-20250514'

function buildPrompt(
  client: ClientData & { isDemo: boolean },
  globalInsights: GlobalInsight[]
): string {
  const sectorSet = new Set([
    client.sector.toLowerCase(),
    ...client.referenceSectors.map(s => s.toLowerCase()),
    'e-commerce',
    'dtc',
  ])
  const relevantInsights = globalInsights.filter(
    (ins) => sectorSet.has(ins.sector.toLowerCase()) ||
      client.referenceSectors.some(s => ins.sector.toLowerCase().includes(s.toLowerCase()))
  )

  const dataSource = client.isDemo
    ? '\n⚠️ NOTE : Ces données sont des données de démonstration. Mentionne "basé sur données démo" dans chaque recommandation.\n'
    : '\n✅ Ces données proviennent des comptes réels du client (Shopify + Meta Ads).\n'

  return `Tu es le Market Brain de BrainMarket. Tu génères des recommandations personnalisées pour un client e-commerce.
${dataSource}
## PROFIL CLIENT

Marque : ${client.brandName}
Secteur principal : ${client.sector}
Secteurs de référence : ${client.referenceSectors.join(', ')}
Pays cibles : ${client.targetCountries.join(', ')}
Revenu 30 jours : ${client.totalRevenue.toLocaleString('fr-FR')}€
Budget pub 30 jours : ${client.totalBudget.toLocaleString('fr-FR')}€
ROAS moyen : ${client.avgRoas.toFixed(2)}x
${client.totalRevenue > 0 && client.totalBudget > 0 ? `ROAS global calculé : ${(client.totalRevenue / client.totalBudget).toFixed(2)}x` : ''}

### Campagnes actives (${client.campaigns.length})
${client.campaigns
  .map(
    (c) =>
      `- "${c.name}" (${c.platform}) — Dépense: ${c.budget}€, ROAS: ${c.roas}x, CTR: ${c.ctr}%, CPM: ${c.cpm}€, Statut: ${c.status}`
  )
  .join('\n')}

### Produits (${client.products.length})
${client.products
  .map(
    (p) =>
      `- "${p.name}" (${p.category}) — Revenu: ${p.revenue.toLocaleString('fr-FR')}€, Ventes: ${p.unitsSold} unités`
  )
  .join('\n')}

## INSIGHTS MARCHÉ (Global Brain)
${
  relevantInsights.length > 0
    ? relevantInsights
        .map(
          (ins) =>
            `- [${ins.sector}] ${ins.insight} (confiance: ${ins.confidenceScore}%) — Source: ${ins.source}`
        )
        .join('\n')
    : 'Aucun insight pertinent disponible pour ce secteur.'
}

## INSTRUCTIONS

Génère 3 à 5 recommandations personnalisées en croisant les données client avec les insights marché.

Priorité aux tendances dans les secteurs : ${client.referenceSectors.join(', ')}. Mentionne l'influence sectorielle dans chaque recommandation.
Adapte les recommandations aux pays cibles du client : ${client.targetCountries.join(', ')}.

Chaque recommandation doit être spécifique au client (mentionne ses campagnes et produits par nom).
${client.isDemo ? 'Précise que les recommandations sont "basées sur données démo" car les vraies données ne sont pas encore connectées.' : 'Base-toi sur les performances réelles pour des recommandations précises et chiffrées.'}

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :

[
  {
    "title": "titre court et actionnable",
    "description": "explication détaillée de pourquoi cette recommandation (2-3 phrases)",
    "action": "action concrète à réaliser (1-2 phrases)",
    "expectedResult": "résultat attendu chiffré si possible",
    "confidenceScore": 85,
    "source": "source(s) sur laquelle se base cette recommandation",
    "sector": "${client.sector}"
  }
]

Le score de confiance (0-100) dépend de :
- La qualité des données client (données réelles = haute confiance, démo = confiance réduite)
- La pertinence des insights marché croisés
- La solidité de l'échantillon source
${client.isDemo ? '- Limite les scores à 70 max car basé sur données démo' : ''}

Priorise les recommandations à fort impact. Ne recommande rien de générique.`
}

function parseRecommendations(text: string): BrainRecommendation[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Réponse Claude non parsable : pas de JSON trouvé')

  return JSON.parse(jsonMatch[0]) as BrainRecommendation[]
}

export async function runClientBrain(
  userId: string,
  globalInsights: GlobalInsight[]
): Promise<BrainRecommendation[]> {
  const clientData = await collectClientData(userId)

  const anthropic = new Anthropic()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildPrompt(clientData, globalInsights),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Pas de réponse texte de Claude')
  }

  const rawRecommendations = parseRecommendations(textBlock.text)

  // Valider
  const validation = validateRecommendations(rawRecommendations, globalInsights)
  const recommendations = validation.recommendations

  if (validation.degradedMode) {
    console.warn('Client Brain en mode dégradé:', validation.errors)
  }

  // Resolve the Supabase user_id for storage
  const supabase = createServerClient()
  let storageUserId = '00000000-0000-0000-0000-000000000001'

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userRow) {
    storageUserId = (userRow as { id: string }).id
  }

  const inserts = recommendations.map((rec) => ({
    user_id: storageUserId,
    title: rec.title,
    description: `${rec.description}\n\nAction: ${rec.action}\n\nRésultat attendu: ${rec.expectedResult}`,
    confidence_score: rec.confidenceScore / 100,
    sector: rec.sector,
    applied: false,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('brain_recommendations').insert(inserts as any)
  if (error) {
    console.error('Erreur insertion brain_recommendations:', error)
  }

  return recommendations
}
