import Anthropic from '@anthropic-ai/sdk'
import { collectGlobalData, SECTORS } from './global-collector'
import { createServerClient } from '@/lib/supabase/server'
import type { GlobalCollectorData, GlobalInsight } from './types'

// ============================================================
// Global Brain — Analyse cross-secteur via Claude API
// Tourne toutes les 4h pour tous les secteurs
// ============================================================

const MODEL = 'claude-sonnet-4-20250514'

function buildPrompt(data: GlobalCollectorData): string {
  return `Tu es le Market Brain de BrainMarket, un moteur d'intelligence publicitaire pour e-commerce.

Analyse les données marché suivantes et génère des insights actionnables pour chaque secteur.

## DONNÉES COLLECTÉES

### Tendances de recherche
${data.trends
  .map(
    (t) =>
      `- [${t.sector}] "${t.keyword}" — ${t.trendDirection} (${t.changePercent > 0 ? '+' : ''}${t.changePercent}%) — Source: ${t.source}`
  )
  .join('\n')}

### Formats publicitaires Meta Ads
${data.adFormats
  .map(
    (f) =>
      `- [${f.sector}] ${f.format} — CTR: ${f.avgCtr}%, CPM: ${f.avgCpm}€, ROAS: ${f.avgRoas}x (n=${f.sampleSize}) — Source: ${f.source}`
  )
  .join('\n')}

### Signaux cross-secteur
${data.crossSectorSignals
  .map(
    (s) =>
      `- [${s.sectors.join(' × ')}] ${s.signal} (force: ${s.strength}) — Source: ${s.source}`
  )
  .join('\n')}

## INSTRUCTIONS

Pour chaque secteur parmi ${SECTORS.join(', ')}, génère 1 à 2 insights.
Chaque insight doit être directement actionnable pour un e-commerçant.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :

[
  {
    "sector": "nom du secteur",
    "insight": "description de l'insight actionnable (2-3 phrases max)",
    "source": "source(s) citée(s) précisément",
    "confidenceScore": 85
  }
]

Le score de confiance est entre 0 et 100. Base-le sur :
- La taille de l'échantillon
- La cohérence entre les sources
- La force du signal

Ne génère PAS d'insight si les données sont insuffisantes. Qualité > quantité.`
}

function parseInsights(text: string): GlobalInsight[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Réponse Claude non parsable : pas de JSON trouvé')

  const parsed = JSON.parse(jsonMatch[0]) as GlobalInsight[]
  return parsed.map((item) => ({
    sector: item.sector,
    insight: item.insight,
    source: item.source,
    confidenceScore: Math.min(100, Math.max(0, item.confidenceScore)),
  }))
}

export async function runGlobalBrain(): Promise<GlobalInsight[]> {
  const data = await collectGlobalData()

  const anthropic = new Anthropic()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildPrompt(data),
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Pas de réponse texte de Claude')
  }

  const insights = parseInsights(textBlock.text)

  // Stocker dans Supabase
  const supabase = createServerClient()
  const inserts = insights.map((ins) => ({
    sector: ins.sector,
    insight: ins.insight,
    source: ins.source,
    confidence_score: ins.confidenceScore / 100, // DB stocke 0-1
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('market_insights').insert(inserts as any)
  if (error) {
    console.error('Erreur insertion market_insights:', error)
  }

  return insights
}
