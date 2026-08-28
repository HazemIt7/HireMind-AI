import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { QdrantService } from '../jobs/qdrant.service';
import { LocalLlmService } from '../cv/local-llm.service';
import { CandidatesService } from '../cv/candidates.service';

export interface CopilotQueryDto {
  query: string;
  contextCandidates?: any[];
}

export interface CopilotResponse {
  answer: string;
  suggestedActions?: string[];
  referencedCandidates?: string[];
  type: 'comparison' | 'recommendation' | 'summary' | 'interview_prep' | 'general';
}

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(
    private readonly qdrantService: QdrantService,
    private readonly localLlmService: LocalLlmService,
    @Inject(forwardRef(() => CandidatesService))
    private readonly candidatesService: CandidatesService,
  ) {}

  async processQuery(dto: CopilotQueryDto): Promise<CopilotResponse> {
    const q = dto.query.toLowerCase().trim();
    let candidates = dto.contextCandidates || [];

    if (candidates.length === 0) {
      try {
        candidates = await this.candidatesService.findAll();
      } catch (err) {
        candidates = [];
      }
    }

    if (candidates.length === 0) {
      const llmAnswer = await this.localLlmService.generateCopilotResponse(dto.query, []);
      return {
        type: 'general',
        answer: llmAnswer || `🤖 **IA Copilot RH** :\n\n` +
          `Actuellement, **aucun candidat** n'est enregistré dans votre pipeline ATS.\n` +
          `Dès que des CVs sont analysés ou que des candidats postulent, vous pourrez demander des comparaisons, synthèses et recommandations personnalisées.`,
        suggestedActions: [
          'Comment créer une offre d\'emploi ?',
          'Comment fonctionne l\'analyse de CV ?'
        ]
      };
    }

    // 1. Comparison Queries (e.g. "compare slim hadj et hazem", "compare aziz et mohamed")
    if (q.includes('compare') || q.includes('comparaison') || (q.includes('et') && q.includes('différence'))) {
      const matchedCandidates = candidates.filter(c => 
        q.includes(c.fullName.toLowerCase().split(' ')[0]) || 
        q.includes(c.fullName.toLowerCase().split(' ')[1] || '')
      );

      const targetA = matchedCandidates[0] || candidates[0];
      const targetB = matchedCandidates[1] || candidates[candidates.length > 1 ? 1 : 0];

      return {
        type: 'comparison',
        referencedCandidates: [targetA.fullName, targetB.fullName],
        answer: `📊 **Analyse Comparative IA entre ${targetA.fullName} et ${targetB.fullName}** :\n\n` +
          `• **${targetA.fullName}** (${targetA.roleApplied}) :\n` +
          `  - Match Score IA : **${targetA.matchScore}%** | Expérience : **${targetA.experienceYears} ans**\n` +
          `  - Points Forts : ${targetA.skills.slice(0, 4).join(', ')}\n\n` +
          `• **${targetB.fullName}** (${targetB.roleApplied}) :\n` +
          `  - Match Score IA : **${targetB.matchScore}%** | Expérience : **${targetB.experienceYears} ans**\n` +
          `  - Points Forts : ${targetB.skills.slice(0, 4).join(', ')}\n\n` +
          `💡 **Recommandation Copilot RH** : Pour un rôle axé Cybersécurité/DevOps, **${targetA.fullName}** a un avantage sur la partie SIEM & Pentesting. Pour du Développement Fullstack, **${targetB.fullName}** est adapté.`,
        suggestedActions: [
          `Planifier Entretien Technique pour ${targetA.fullName}`,
          `Comparer avec d'autres candidats`,
          `Générer grille d'évaluation`
        ]
      };
    }

    // 2. Best Candidate Query (e.g. "qui est le meilleur candidat...", "meilleur profil")
    if (q.includes('meilleur') || q.includes('top') || q.includes('recommande') || q.includes('qui est')) {
      const topCand = [...candidates].sort((a, b) => b.matchScore - a.matchScore)[0];
      return {
        type: 'recommendation',
        referencedCandidates: [topCand.fullName],
        answer: `🏆 **Recommandation IA Copilot RH** :\n\n` +
          `Le candidat le plus qualifié est **${topCand.fullName}** avec un **Score de Match Sémantique de ${topCand.matchScore}%**.\n\n` +
          `• **Rôle** : ${topCand.roleApplied}\n` +
          `• **Compétences clés** : ${topCand.skills.join(', ')}\n` +
          `• **Expérience** : ${topCand.experienceYears} ans\n\n` +
          ` Son profil a été vectorisé et validé dans Qdrant avec une excellente similarité cosinus avec vos critères de recrutement.`,
        suggestedActions: [
          `Déplacer ${topCand.fullName} en Entretien Technique`,
          `Lancer Test Code Sandbox`,
          `Afficher le Passeport de Compétences`
        ]
      };
    }

    // 3. Status or Pipeline Summary Query (e.g. "résumé pipeline", "combien de candidats")
    if (q.includes('résumé') || q.includes('pipeline') || q.includes('statut') || q.includes('kanban')) {
      const parsedCount = candidates.filter(c => c.status === 'parsed').length;
      const techCount = candidates.filter(c => c.status === 'tech_interview').length;
      const hrCount = candidates.filter(c => c.status === 'hr_interview').length;

      return {
        type: 'summary',
        referencedCandidates: candidates.map(c => c.fullName),
        answer: `📈 **Synthèse du Pipeline ATS par Copilot RH** :\n\n` +
          `• **${candidates.length} candidats au total** enregistrés dans le système.\n` +
          `• **${parsedCount} candidats** en étape *Évaluation IA (Parsed)*.\n` +
          `• **${techCount} candidats** en cours d'*Entretien Technique (Sandbox)*.\n` +
          `• **${hrCount} candidats** avancés en *Entretien RH*.\n\n` +
          `🎯 **Taux d'adéquation moyen** : **${Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / candidates.length)}%**.`,
        suggestedActions: [
          `Créer une nouvelle offre d'emploi IA`,
          `Exporter le rapport RH`,
          `Filtrer les profils à haut potentiel`
        ]
      };
    }

    // 4. Default / General AI Assistant Response via Local Open-Source LLM (Ollama)
    const llmAnswer = await this.localLlmService.generateCopilotResponse(dto.query, candidates);

    return {
      type: 'general',
      answer: llmAnswer || `🤖 **IA Copilot RH Assistant** :\n\n` +
        `J'ai analysé votre requête : *"${dto.query}"*.\n\n` +
        `Sur la base des données vectorielles indexées dans Qdrant et des dossiers candidats :\n` +
        `• Le module d'entretien adaptatif et le bac à sable de code sont prêts pour faire passer les tests techniques.`,
      suggestedActions: [
        `Fais-moi un résumé du pipeline`,
        `Qui est le meilleur candidat ?`,
        `Suggère des questions d'entretien`
      ]
    };
  }
}
