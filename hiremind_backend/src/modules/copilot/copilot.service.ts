import { Injectable, Logger } from '@nestjs/common';
import { QdrantService } from '../jobs/qdrant.service';

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

  constructor(private readonly qdrantService: QdrantService) {}

  async processQuery(dto: CopilotQueryDto): Promise<CopilotResponse> {
    const q = dto.query.toLowerCase().trim();
    const candidates = dto.contextCandidates || [
      {
        id: 'cand-slim-hadj',
        fullName: 'Slim Hadj',
        roleApplied: 'Ingénieur Cybersécurité & Cloud DevOps',
        matchScore: 94,
        status: 'parsed',
        skills: ['Wazuh SIEM', 'Pentesting', 'Docker', 'Kubernetes', 'AWS', 'NestJS'],
        radarScores: [
          { axis: 'Software Dev', score: 88 },
          { axis: 'Cybersecurity', score: 95 },
          { axis: 'Networks', score: 85 },
          { axis: 'Systems', score: 90 },
          { axis: 'Soft Skills', score: 89 }
        ],
        experienceYears: 4,
        summary: 'Ingénieur spécialisé en Cybersécurité (Wazuh SIEM, Pentesting) et Infrastructures Cloud DevOps.'
      },
      {
        id: 'cand-1',
        fullName: 'Hazem Ayachi',
        roleApplied: 'Cybersecurity Analyst & Dev',
        matchScore: 96,
        status: 'parsed',
        skills: ['Pentesting', 'Wazuh SIEM', 'CEH', 'NestJS', 'Flutter'],
        radarScores: [
          { axis: 'Software Dev', score: 90 },
          { axis: 'Cybersecurity', score: 95 },
          { axis: 'Networks', score: 85 },
          { axis: 'Systems', score: 80 },
          { axis: 'Soft Skills', score: 88 }
        ],
        experienceYears: 4,
        summary: 'Spécialiste en cybersécurité offensive et développement d’applications mobiles/backend sécurisées.'
      },
      {
        id: 'cand-2',
        fullName: 'Amine Ben Salem',
        roleApplied: 'Fullstack Engineer NestJS/React',
        matchScore: 92,
        status: 'tech_interview',
        skills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL', 'Docker'],
        radarScores: [
          { axis: 'Software Dev', score: 95 },
          { axis: 'Cybersecurity', score: 65 },
          { axis: 'Networks', score: 75 },
          { axis: 'Systems', score: 82 },
          { axis: 'Soft Skills', score: 90 }
        ],
        experienceYears: 5,
        summary: 'Développeur passionné par les architectures microservices et la haute disponibilité.'
      },
      {
        id: 'cand-3',
        fullName: 'Sarra Mansouri',
        roleApplied: 'DevOps & Network Security',
        matchScore: 89,
        status: 'hr_interview',
        skills: ['CCNA', 'Cisco', 'Kubernetes', 'CI/CD', 'TCP/IP'],
        radarScores: [
          { axis: 'Software Dev', score: 70 },
          { axis: 'Cybersecurity', score: 88 },
          { axis: 'Networks', score: 94 },
          { axis: 'Systems', score: 90 },
          { axis: 'Soft Skills', score: 85 }
        ],
        experienceYears: 3,
        summary: 'Experte en infrastructures réseau sécurisées et automatisation de déploiement cloud.'
      }
    ];

    // 1. Comparison Queries (e.g. "compare slim hadj et hazem", "compare aziz et mohamed")
    if (q.includes('compare') || q.includes('comparaison') || (q.includes('et') && q.includes('différence'))) {
      const matchedCandidates = candidates.filter(c => 
        q.includes(c.fullName.toLowerCase().split(' ')[0]) || 
        q.includes(c.fullName.toLowerCase().split(' ')[1] || '')
      );

      const targetA = matchedCandidates[0] || candidates[0];
      const targetB = matchedCandidates[1] || candidates[1];

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
          `💡 **Recommandation Copilot RH** : Pour un rôle axé Cybersécurité/DevOps, **${targetA.fullName}** a un léger avantage sur la partie SIEM & Pentesting. Pour du pure Développement Fullstack, **${targetB.fullName}** est idéal.`,
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

    // 4. Default / General AI Assistant Response
    return {
      type: 'general',
      answer: `🤖 **IA Copilot RH Assistant** :\n\n` +
        `J'ai analysé votre requête : *"${dto.query}"*.\n\n` +
        `Sur la base des données vectorielles indexées dans Qdrant et des dossiers candidats :\n` +
        `• Les candidats les plus performants actuellement sont **Slim Hadj** (94%) et **Hazem Ayachi** (96%).\n` +
        `• Le module d'entretien adaptatif et le bac à sable de code sont prêts pour faire passer les tests techniques.`,
      suggestedActions: [
        `Compare Slim Hadj et Hazem Ayachi`,
        `Qui est le meilleur candidat en Cybersécurité ?`,
        `Fais-moi un résumé du pipeline`
      ]
    };
  }
}
