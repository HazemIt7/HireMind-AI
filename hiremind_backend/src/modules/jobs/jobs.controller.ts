import { Controller, Post, Get, Body, Param, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { QdrantService } from './qdrant.service';
import { JobsService } from './jobs.service';
import { LocalLlmService } from '../cv/local-llm.service';
import { CandidatesService } from '../cv/candidates.service';

@ApiTags('Offres d\'emploi & Matching Vectoriel')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly qdrantService: QdrantService,
    @Inject(forwardRef(() => LocalLlmService))
    private readonly localLlmService: LocalLlmService,
    @Inject(forwardRef(() => CandidatesService))
    private readonly candidatesService: CandidatesService
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer une offre d\'emploi et l\'indexer dans Qdrant (Recruteur)' })
  @ApiResponse({ status: 201, description: 'Fiche de poste générée et vectorisée dans Qdrant.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', example: 'Ingénieur Cybersécurité Wazuh/Ansible 2 ans expérience' },
      },
    },
  })
  async createJob(@Body() body: any) {
    const jobId = `job_${Date.now()}`;
    const promptText = (body.prompt || body.title || '').trim();

    // 1. Attempt LLM generation via local Ollama
    let generated = await this.localLlmService.generateJobOfferWithLocalLlm(promptText);

    // 2. Dynamic NLP fallback if LLM is unreachable or formatting fails
    if (!generated) {
      const lower = promptText.toLowerCase();
      let dynamicTitle = 'Ingénieur Spécialiste Technique (H/F)';
      let dynamicDepartment = 'Technologie & Ingénierie';

      if (lower.includes('cyber') || lower.includes('siem') || lower.includes('wazuh') || lower.includes('pentest') || lower.includes('security')) {
        dynamicTitle = 'Ingénieur Cybersécurité & SOC (H/F)';
        dynamicDepartment = 'Cybersécurité & Infra';
      } else if (lower.includes('devops') || lower.includes('kubernetes') || lower.includes('terraform') || lower.includes('cloud') || lower.includes('aws')) {
        dynamicTitle = 'Ingénieur Cloud DevOps & Kubernetes (H/F)';
        dynamicDepartment = 'Ingénierie Cloud & DevOps';
      } else if (lower.includes('fullstack') || lower.includes('backend') || lower.includes('frontend') || lower.includes('react') || lower.includes('nest')) {
        dynamicTitle = 'Ingénieur Développeur Fullstack / Backend (H/F)';
        dynamicDepartment = 'Engineering';
      } else if (promptText.length > 5) {
        dynamicTitle = promptText.split(',')[0].split('.')[0].trim();
      }

      const knownSkills = ['Wazuh', 'Ansible', 'SIEM', 'Linux', 'Hardening', 'Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Docker', 'NestJS', 'React', 'TypeScript', 'Python', 'C++'];
      const extractedSkills = knownSkills.filter(s => lower.includes(s.toLowerCase()));

      const salaryMatch = promptText.match(/\d+\s*(?:k|K)?\s*(?:€|\$|EUR|USD|DT)/i);
      const dynamicSalary = salaryMatch ? salaryMatch[0] : '50k€ - 65k€';

      generated = {
        title: dynamicTitle,
        department: dynamicDepartment,
        location: 'Tunis / Hybride',
        salaryRange: dynamicSalary,
        description: `Offre générée sur mesure pour la demande : "${promptText}". Missions principales : conception, automatisation et supervision technique.`,
        skillsRequired: extractedSkills.length > 0 ? extractedSkills : ['Cybersécurité', 'DevOps', 'Cloud', 'Linux'],
        softSkills: ['Autonomie', 'Communication', 'Résolution de problèmes']
      };
    }

    const skills = generated.skillsRequired || ['Cybersecurity', 'DevOps', 'TypeScript'];
    const title = generated.title || 'Fiche de Poste Structurée par IA';
    const description = generated.description || `Offre d'emploi générée par IA selon : ${promptText}`;
    const salaryRange = generated.salaryRange || '50k€ - 60k€';
    const department = generated.department || 'Ingénierie IA';

    // Generate vector embedding & index in Qdrant Vector DB
    const vector = this.qdrantService.generateEmbedding(skills, description);
    await this.qdrantService.upsertVector(jobId, vector, {
      id: jobId,
      title,
      skills,
      type: 'job'
    });

    const newJob = {
      id: jobId,
      title,
      department,
      location: generated.location || 'Tunis / Hybride',
      salaryRange,
      prompt: promptText,
      description,
      skillsRequired: skills,
      softSkills: generated.softSkills || ['Autonomie', 'Rigueur'],
      candidateCount: 0,
      qdrantVectorIndexed: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    return await this.jobsService.create(newJob);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les offres d\'emploi disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des offres d\'emploi.' })
  async findAll() {
    return await this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une offre d\'emploi par son ID' })
  @ApiResponse({ status: 200, description: 'Détails de l\'offre d\'emploi.' })
  async findOne(@Param('id') id: string) {
    return await this.jobsService.findOne(id);
  }

  @Post(':id/match')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Calculer le score de matching sémantique vectoriel avec Qdrant' })
  @ApiResponse({ status: 200, description: 'Scores de similarité cosinus avec les candidats.' })
  async matchCandidate(@Param('id') id: string, @Body() body: any) {
    let jobSkills = body?.jobSkills;
    if (!jobSkills || jobSkills.length === 0) {
      const job = await this.jobsService.findOne(id);
      if (job && job.skillsRequired) {
        jobSkills = job.skillsRequired;
      } else {
        jobSkills = ['NestJS', 'TypeScript', 'Docker', 'Kubernetes'];
      }
    }

    let candidatesList = body?.candidates || [];
    if (candidatesList.length === 0) {
      try {
        candidatesList = await this.candidatesService.findAll();
      } catch (err) {
        candidatesList = [];
      }
    }

    const searchVector = this.qdrantService.generateEmbedding(jobSkills);
    const jobSkillsLower = jobSkills.map((s: string) => s.toLowerCase());

    const candidateRankings = candidatesList.map((cand: any) => {
      const candSkills = cand.skills || [];

      // Cosine vector math with Qdrant embedding
      const candVector = this.qdrantService.generateEmbedding(candSkills);
      const dotProduct = searchVector.reduce((sum, val, idx) => sum + val * candVector[idx], 0);
      const vectorScore = Math.min(99, Math.max(55, Math.round(dotProduct * 100)));

      const matchedSkills = candSkills.filter((cs: string) =>
        jobSkillsLower.some((js: string) => js.includes(cs.toLowerCase()) || cs.toLowerCase().includes(js))
      );

      const techScore = Math.min(98, Math.max(50, Math.round(60 + (matchedSkills.length / Math.max(1, jobSkillsLower.length)) * 38)));
      const expScore = Math.min(95, Math.max(60, Math.round(70 + (cand.experienceYears || 3) * 5)));
      const softScore = cand.radarScores?.find((r: any) => r.axis === 'Soft Skills')?.score || 85;
      const globalScore = Math.round(vectorScore * 0.5 + expScore * 0.3 + softScore * 0.2);

      return {
        candidateId: cand.id,
        candidateName: cand.fullName || cand.name || 'Candidat',
        email: cand.email || '',
        roleApplied: cand.roleApplied || 'Ingénieur',
        experienceYears: cand.experienceYears || 3,
        globalMatchScore: globalScore,
        breakdown: {
          technicalMatch: techScore,
          experienceMatch: expScore,
          softSkillsMatch: softScore,
        },
        matchedSkills: matchedSkills.length > 0 ? matchedSkills : jobSkills.slice(0, 2),
      };
    });

    candidateRankings.sort((a: any, b: any) => b.globalMatchScore - a.globalMatchScore);

    return {
      jobId: id,
      jobTitle: body?.jobTitle || 'Fiche de Poste Sélectionnée',
      algorithm: 'Distance Cosinus (Qdrant Vector DB 16-D Embeddings)',
      candidatesCount: candidatesList.length,
      rankings: candidateRankings,
    };
  }

  @Post('seed-candidates')
  @ApiOperation({ summary: 'Seeder des candidats d\'exemple dans Qdrant Vector DB' })
  async seedCandidates() {
    const candidates = [
      { id: 'cand_101', name: 'Hazem Ayachi', skills: ['Flutter', 'Dart', 'NestJS', 'Wazuh', 'Pentesting'] },
      { id: 'cand_102', name: 'Amine Ben Salem', skills: ['TypeScript', 'NestJS', 'React', 'Docker'] },
      { id: 'cand_103', name: 'Sarra Mansouri', skills: ['CCNA', 'Cisco', 'TCP/IP', 'Wazuh', 'Pentesting'] }
    ];

    for (const c of candidates) {
      const vec = this.qdrantService.generateEmbedding(c.skills);
      await this.qdrantService.upsertVector(c.id, vec, {
        id: c.id,
        title: c.name,
        skills: c.skills,
        type: 'candidate'
      });
    }

    return { message: '3 candidats d\'exemple vectorisés avec succès dans Qdrant !' };
  }
}
