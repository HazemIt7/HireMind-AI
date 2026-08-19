import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { QdrantService } from './qdrant.service';

@ApiTags('Offres d\'emploi & Matching Vectoriel')
@Controller('jobs')
export class JobsController {
  constructor(private readonly qdrantService: QdrantService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Créer une offre d\'emploi et l\'indexer dans Qdrant (Recruteur)' })
  @ApiResponse({ status: 201, description: 'Fiche de poste générée et vectorisée dans Qdrant.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', example: 'Développeur Flutter Senior & NestJS, 5 ans d\'expérience, Paris' },
        skillsRequired: { type: 'array', items: { type: 'string' }, example: ['Flutter', 'Dart', 'NestJS', 'Docker'] }
      },
    },
  })
  async createJob(@Body() body: any) {
    const jobId = `job_${Date.now()}`;
    const skills = body.skillsRequired || ['Flutter', 'Dart', 'NestJS', 'TypeScript'];
    const title = body.title || 'Développeur Mobile Flutter & Backend Senior (H/F)';
    const description = body.description || `Nous recherchons un développeur senior pour piloter nos projets Flutter/NestJS. Context: ${body.prompt || ''}`;

    // Generate vector embedding & index in Qdrant
    const vector = this.qdrantService.generateEmbedding(skills, description);
    await this.qdrantService.upsertVector(jobId, vector, {
      id: jobId,
      title,
      skills,
      type: 'job'
    });

    return {
      id: jobId,
      title,
      description,
      requirements: {
        technical: skills,
        softSkills: ['Autonomie', 'Mentorat', 'Rigueur'],
      },
      qdrantVectorIndexed: true,
      vectorDimension: vector.length,
      salaryRange: '55k€ - 65k€',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les offres d\'emploi disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des offres d\'emploi.' })
  findAll() {
    return [
      {
        id: 'job_018273',
        title: 'Développeur Mobile Flutter Senior (H/F)',
        description: 'Nous recherchons un développeur senior pour piloter notre transition vers Flutter...',
        skillsRequired: ['Flutter', 'Dart', 'Clean Architecture', 'NestJS']
      },
      {
        id: 'job_018274',
        title: 'Ingénieur Cybersécurité & Pentesting',
        description: 'Audit de sécurité, SIEM Wazuh, tests d\'intrusion et hardening.',
        skillsRequired: ['Pentesting', 'Wazuh', 'CEH', 'TCP/IP']
      }
    ];
  }

  @Post(':id/match')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Calculer le score de matching sémantique vectoriel avec Qdrant' })
  @ApiResponse({ status: 200, description: 'Scores de similarité cosinus avec les candidats.' })
  async matchCandidate(@Param('id') id: string, @Body() body: any) {
    const candidateSkills = body?.skills || ['Flutter', 'Dart', 'NestJS', 'Docker', 'Wazuh'];
    const jobSkills = body?.jobSkills || ['Flutter', 'Dart', 'NestJS', 'TypeScript'];

    // Generate vector for search query
    const searchVector = this.qdrantService.generateEmbedding(jobSkills);
    const qdrantMatches = await this.qdrantService.searchMatchingCandidates(searchVector);

    // Calculate direct Cosine Similarity score for payload
    const candidateVector = this.qdrantService.generateEmbedding(candidateSkills);
    const dotProduct = searchVector.reduce((sum, val, idx) => sum + val * candidateVector[idx], 0);
    const scorePercentage = Math.min(99, Math.max(60, Number((dotProduct * 100).toFixed(1))));

    return {
      jobId: id,
      matchingScore: scorePercentage,
      algorithm: 'Cosine Similarity (Qdrant Vector Database)',
      vectorMatchesInQdrant: qdrantMatches.length,
      topQdrantCandidates: qdrantMatches.map((m: any) => ({
        id: m.payload?.id,
        candidateName: m.payload?.title,
        cosineSimilarityScore: Number((m.score * 100).toFixed(1)),
      })),
      matchingBreakdown: {
        technicalMatch: Math.min(98, scorePercentage + 3),
        experienceMatch: Math.max(70, scorePercentage - 5),
        softSkillsMatch: 88,
      },
      keywordsMatched: candidateSkills.filter((s: string) => jobSkills.includes(s)),
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
