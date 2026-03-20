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
  client: ClientData,
  globalInsights: GlobalInsight[]
): string {
  const relevantInsights = globalInsights.filter(
    (ins) =>
      ins.sector === client.sector ||
      ins.sector.toLowerCase().includes('e-commerce') ||
      ins.sector.toLowerCase().includes('dtc')
  )

  return `Tu es le Market Brain de BrainMarket. Tu génères des recommandations personnalisées pour un client e-commerce.

## PROFIL CLIENT

Marque : ${client.brandName}
Secteur : ${client.sector}
Revenu total : ${client.totalRevenue.toLocaleString('fr-FR')}€
Budget pub total : ${client.totalBudget.toLocaleString('fr-FR')}€
ROAS moyen : ${client.avgRoas.toFixed(2)}x

### Campagnes actives
${client.campaigns
  .map(
    (c) =>
      `- "${c.name}" (${c.platform}) — Budget: ${c.budget}€, ROAS: ${c.roas}x, CTR: ${c.ctr}%, CPM: ${c.cpm}€, Statut: ${c.status}`
  )
  .join('\n')}

### Produits
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

Chaque recommandation doit être spécifique au client (mentionne ses campagnes et produits par nom).

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
- La qualité des données client (campagnes actives avec historique = haute confiance)
- La pertinence des insights marché croisés
- La solidité de l'échantillon source

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

  // Stocker dans Supabase
  const supabase = createServerClient()
  const inserts = recommendations.map((rec) => ({
    user_id: userId,
    title: rec.title,
    description: `${rec.description}\n\nAction: ${rec.action}\n\nRésultat attendu: ${rec.expectedResult}`,
    confidence_score: rec.confidenceScore / 100, // DB stocke 0-1
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
