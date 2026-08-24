import { Injectable, Logger } from '@nestjs/common';

export interface LlMParsedCv {
  fullName: string;
  email: string;
  phone: string;
  primaryDomain?: 'Cybersecurity' | 'SoftwareDev' | 'DevOps' | 'Networks';
  seniorityLevel?: 'Junior' | 'Mid' | 'Senior';
  technicalSkills: string[];
  softSkills: string[];
  radarScores?: { axis: string; score: number; label: string }[];
  summary: string;
  llmModelUsed: string;
}

@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);
  private readonly ollamaUrl = 'http://localhost:11434';
  private readonly preferredModels = ['qwen2.5:1.5b', 'llama3', 'tinyllama', 'phi3'];

  /**
   * Parse CV text using local open-source LLM (Ollama) with 0 API cost
   */
  async parseCvWithLocalLlm(cvText: string): Promise<LlMParsedCv | null> {
    const activeModel = await this.detectAvailableModel();
    if (!activeModel) {
      this.logger.warn('No local Ollama model available yet, using local NLP parser fallback.');
      return null;
    }

    const prompt = `
Tu es un Expert RH et Auditeur Technique spécialisé dans les Métiers du Numérique (Développement Software, Cloud DevOps, Réseaux et Cybersécurité).

MISSION :
Analyse le texte du CV ci-dessous. Extrais l'identité, le domaine principal (primaryDomain), le niveau de séniorité, les compétences clés et une synthèse professionnelle.

CLASSIFICATION DU DOMAINE PRINCIPAL (primaryDomain) :
- "Cybersecurity" : Si le profil est un Analyste SOC, Auditeur Sécurité, Incident Responder, Pentester, ou Spécialiste SIEM/EDR (Splunk, Wazuh, Sentinel, CrowdStrike, MITRE ATT&CK, Security+, CyberOps).
- "SoftwareDev" : Si le profil est un Développeur Backend, Frontend, Fullstack ou Mobile (Node.js, NestJS, Python, Go, Java, React, Flutter, Microservices).
- "DevOps" : Si le profil est un Ingénieur DevOps, Cloud ou Administrateur Système (Docker, Kubernetes, AWS, Terraform, CI/CD, Linux).
- "Networks" : Si le profil est un Ingénieur Réseau ou Telecom (CCNA, Cisco, Routage, Commutation, BGP, VPN).

TEXTE DU CV :
----------------------------------------
${cvText.slice(0, 3500)}
----------------------------------------

FORMAT DE RÉPONSE EXIGÉ (JSON STRICT) :
{
  "fullName": "Prénom et Nom exacts du candidat",
  "email": "Email professionnel extrait ou vide",
  "phone": "Numéro de téléphone ou vide",
  "primaryDomain": "Cybersecurity" OU "SoftwareDev" OU "DevOps" OU "Networks",
  "seniorityLevel": "Junior" OU "Mid" OU "Senior",
  "technicalSkills": ["Liste des compétences techniques clés"],
  "softSkills": ["Liste des aptitudes comportementales et méthodologiques"],
  "summary": "Synthèse de 2 phrases décrivant la valeur ajoutée et le profil du candidat."
}
`;

    try {
      this.logger.log(`Invoking local open-source LLM '${activeModel}' on Ollama...`);
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        let rawText = (data.response || '').trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(rawText);

        this.logger.log(`Local LLM '${activeModel}' successfully parsed CV for: ${parsed.fullName || 'Candidate'} (Domain: ${parsed.primaryDomain || 'Unknown'})`);
        return {
          fullName: parsed.fullName || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          primaryDomain: parsed.primaryDomain,
          seniorityLevel: parsed.seniorityLevel,
          technicalSkills: parsed.technicalSkills || [],
          softSkills: parsed.softSkills || [],
          summary: parsed.summary || '',
          llmModelUsed: `Ollama Local (${activeModel})`
        };
      }
    } catch (err: any) {
      this.logger.warn(`Local LLM parsing call failed or timed out: ${err.message}`);
    }

    return null;
  }

  /**
   * Generate an intelligent Copilot RH response using local Ollama LLM
   */
  async generateCopilotResponse(query: string, candidates: any[]): Promise<string | null> {
    const activeModel = await this.detectAvailableModel();
    if (!activeModel) return null;

    const candSummary = candidates.map(c => 
      `- ${c.fullName || c.name || 'Candidat'} (${c.roleApplied || 'Profil'}) : Match ${c.matchScore || 85}%, Statut: ${c.status || 'En attente'}, Compétences: ${(c.skills || []).join(', ')}`
    ).join('\n');

    const prompt = `
Tu es l'assistant IA Copilot RH de la plateforme HireMind AI.
Réponds de manière professionnelle, synthétique et utile en Markdown au recruteur.

DONNÉES DES CANDIDATS ACTUELS DANS LE PIPELINE :
${candSummary || 'Aucun candidat enregistré pour le moment.'}

QUESTION DU RECRUTEUR :
"${query}"

DIRECTIVES :
- Réponds en français clair, structuré avec des puces et du texte en gras (**text**).
- Sois constructif, précis et d'une aide RH de premier ordre.
`;

    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        return (data.response || '').trim();
      }
    } catch (err: any) {
      this.logger.warn(`Local LLM Copilot call failed: ${err.message}`);
    }
    return null;
  }

  /**
   * Generate structured job offer using local Ollama LLM
   */
  async generateJobOfferWithLocalLlm(promptText: string): Promise<any | null> {
    const activeModel = await this.detectAvailableModel();
    if (!activeModel) return null;

    const prompt = `
Tu es un Expert RH et Directeur du Recrutement spécialisé dans les Métiers du Numérique.

MISSION :
Génère une fiche de poste professionnelle, structurée et complète en fonction de la demande du recruteur ci-dessous.

DEMANDE DU RECRUTEUR :
"${promptText}"

RÈGLES STRICTES DE GÉNÉRATION :
- Génère un titre exact ("title") correspondant au poste demandé (ex: "Ingénieur en Cybersécurité", "Ingénieur Cloud DevOps", "Développeur Fullstack"). Ne génère JAMAIS un titre de Développeur Flutter sauf si le prompt le demande explicitement.
- Extrais la fourchette de salaire ("salaryRange") mentionnée ou évalue une fourchette du marché (ex: "45k€ - 55k€" ou "45k$ - 55k$").
- Extrais le département ("department") approprié (ex: "Cybersécurité & Infra", "Ingénierie Cloud & DevOps", "Développement Software").
- Extrais les compétences techniques ("skillsRequired") mentionnées dans la demande (ex: ["Wazuh", "Ansible", "SIEM", "Linux", "Hardening"] ou ["Kubernetes", "Terraform", "CI/CD", "AWS"]).
- Rédige une description professionnelle de 2-3 phrases ("description") décrivant le rôle et les missions.

FORMAT DE RÉPONSE EXIGÉ (JSON STRICT) :
{
  "title": "Titre exact de l'offre d'emploi",
  "department": "Département métier",
  "location": "Lieu de travail ou Remote",
  "salaryRange": "Fourchette de salaire",
  "description": "Description détaillée et missions principales du poste.",
  "skillsRequired": ["Compétence 1", "Compétence 2", "Compétence 3", "Compétence 4"],
  "softSkills": ["Soft skill 1", "Soft skill 2", "Soft skill 3"]
}
`;

    try {
      this.logger.log(`Invoking Ollama LLM '${activeModel}' to generate job offer for prompt: "${promptText}"`);
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (response.ok) {
        const data = await response.json();
        let rawText = (data.response || '').trim();
        if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(rawText);
        return parsed;
      }
    } catch (err: any) {
      this.logger.warn(`Local LLM job offer generation failed: ${err.message}`);
    }

    return null;
  }

  /**
   * Detect which Ollama model is currently downloaded and available to run
   */
  private async detectAvailableModel(): Promise<string | null> {
    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const installed = (data.models || []).map((m: any) => m.name.toLowerCase());

        for (const pref of this.preferredModels) {
          if (installed.some((name: string) => name.includes(pref))) {
            return pref;
          }
        }
        if (installed.length > 0) {
          return installed[0];
        }
      }
    } catch (e) {
      // Ollama not reachable
    }
    return null;
  }
}
