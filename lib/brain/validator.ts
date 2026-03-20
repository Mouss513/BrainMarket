import type { BrainRecommendation, GlobalInsight, ValidationResult } from './types'

// ============================================================
// Validator — Vérifie la qualité des recommandations du Brain
// ============================================================

const MIN_SOURCES_FOR_FULL_MODE = 3

export function validateRecommendations(
  recommendations: BrainRecommendation[],
  globalInsights: GlobalInsight[]
): ValidationResult {
  const errors: string[] = []
  const validRecs: BrainRecommendation[] = []
  const degradedMode = globalInsights.length < MIN_SOURCES_FOR_FULL_MODE

  if (degradedMode) {
    errors.push(
      `Mode dégradé : seulement ${globalInsights.length} source(s) globale(s) disponible(s) (minimum ${MIN_SOURCES_FOR_FULL_MODE}). Les scores de confiance seront réduits.`
    )
  }

  for (const rec of recommendations) {
    const recErrors: string[] = []

    // Vérifier que la source est citée
    if (!rec.source || rec.source.trim().length === 0) {
      recErrors.push(`Recommandation "${rec.title}" : source manquante`)
    }

    // Vérifier le score de confiance
    if (
      typeof rec.confidenceScore !== 'number' ||
      rec.confidenceScore < 0 ||
      rec.confidenceScore > 100
    ) {
      recErrors.push(
        `Recommandation "${rec.title}" : score de confiance invalide (${rec.confidenceScore})`
      )
      // Clamp
      rec.confidenceScore = Math.min(100, Math.max(0, rec.confidenceScore || 50))
    }

    // Vérifier les champs requis
    if (!rec.title || rec.title.trim().length === 0) {
      recErrors.push('Titre manquant')
    }
    if (!rec.description || rec.description.trim().length === 0) {
      recErrors.push('Description manquante')
    }
    if (!rec.action || rec.action.trim().length === 0) {
      recErrors.push('Action manquante')
    }
    if (!rec.expectedResult || rec.expectedResult.trim().length === 0) {
      recErrors.push('Résultat attendu manquant')
    }

    // En mode dégradé, réduire la confiance de 20%
    if (degradedMode) {
      rec.confidenceScore = Math.round(rec.confidenceScore * 0.8)
    }

    if (recErrors.length === 0) {
      validRecs.push(rec)
    } else {
      // Inclure quand même si c'est juste la source qui manque — enrichir avec un placeholder
      if (recErrors.length === 1 && recErrors[0].includes('source manquante')) {
        rec.source = 'Analyse interne BrainMarket (source non vérifiée)'
        rec.confidenceScore = Math.round(rec.confidenceScore * 0.7) // Pénalité
        validRecs.push(rec)
      }
      errors.push(...recErrors)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    degradedMode,
    recommendations: validRecs,
  }
}
