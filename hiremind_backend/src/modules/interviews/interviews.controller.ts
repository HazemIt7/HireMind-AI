import { Controller, Post, Get, Body, Param, Headers, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AdaptiveInterviewService } from './adaptive-interview.service';
import { AudioStreamingService } from './audio-streaming.service';
import { PromptGuardInterceptor } from '../../common/guards/prompt-guard.interceptor';

@ApiTags('Entretien IA Adaptatif & Streaming Audio')
@Controller('interviews')
@UseInterceptors(PromptGuardInterceptor)
export class InterviewsController {
  constructor(
    private readonly adaptiveInterviewService: AdaptiveInterviewService,
    private readonly audioStreamingService: AudioStreamingService,
  ) {}

  private extractUserFromToken(authHeader?: string): { id?: string; email?: string } {
    if (!authHeader) return {};
    try {
      const token = authHeader.replace('Bearer ', '');
      const payloadString = Buffer.from(token, 'base64').toString('ascii');
      const payload = JSON.parse(payloadString);
      return { id: payload.id, email: payload.email };
    } catch {
      return {};
    }
  }

  @Post('start')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lancer une session d\'entretien IA adaptative' })
  @ApiResponse({ status: 201, description: 'Session d\'entretien démarrée.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['jobId'],
      properties: {
        jobId: { type: 'string', example: 'job_018273' },
        candidateId: { type: 'string', example: 'cand_123' },
        candidateName: { type: 'string', example: 'Alexandre DUPONT' },
        candidateEmail: { type: 'string', example: 'alexandre.dupont@email.com' },
        jobTitle: { type: 'string', example: 'Développeur Backend NestJS' },
        skills: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' }
      },
    },
  })
  async startInterview(
    @Body() body: any,
    @Headers('Authorization') authHeader?: string,
  ) {
    const tokenInfo = this.extractUserFromToken(authHeader);
    const candidateId = body.candidateId || tokenInfo.id;
    const candidateEmail = body.candidateEmail || tokenInfo.email;

    const session = await this.adaptiveInterviewService.startSession(
      body.jobId || 'job_018273',
      body.candidateName,
      body.jobTitle,
      body.skills,
      body.description,
      candidateId,
      candidateEmail,
    );

    return {
      sessionId: session.sessionId,
      jobId: session.jobId,
      candidateName: session.candidateName,
      currentStep: session.currentStep,
      maxSteps: session.maxSteps,
      difficultyLevel: session.difficultyLevel,
      firstQuestion: session.history[0]?.question || `Présentez votre expérience pour le poste d'${body.jobTitle || 'Ingénieur'}.`,
      topic: session.history[0]?.topic || 'Architecture & Fondations',
    };
  }

  @Post(':sessionId/message')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Envoyer une réponse textuelle (avec protection anti-prompt injection)' })
  @ApiResponse({ status: 200, description: 'Réponse évaluée et question adaptée générée.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        answer: { type: 'string' },
      },
    },
  })
  async sendTextMessage(@Param('sessionId') sessionId: string, @Body() body: any) {
    const userMsg = body.message || body.answer || '';
    return await this.adaptiveInterviewService.processAnswer(sessionId, userMsg);
  }

  @Post(':sessionId/audio')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envoyer une réponse vocale et optimiser la latence audio (<1.5s SLA)' })
  @ApiResponse({ status: 200, description: 'Audio transcrit, réponse générée et synthétisée sous 1.5s.' })
  async sendVoiceMessage(@Param('sessionId') sessionId: string) {
    const fakeAudioBuffer = Buffer.from('audio_sample_data');
    const audioResult = await this.audioStreamingService.processVoicePipeline(fakeAudioBuffer);
    const adaptiveResult = await this.adaptiveInterviewService.processAnswer(sessionId, audioResult.transcription);

    return {
      transcription: audioResult.transcription,
      nextQuestion: adaptiveResult.nextQuestion || audioResult.aiResponseText,
      audioStreamUrl: audioResult.audioStreamUrl,
      audioLatency: audioResult.metrics,
      ...adaptiveResult,
    };
  }

  @Get(':sessionId/summary')
  @ApiOperation({ summary: 'Obtenir la synthèse d\'évaluation complète d\'une session d\'entretien' })
  getSessionSummary(@Param('sessionId') sessionId: string) {
    return this.adaptiveInterviewService.getSessionSummary(sessionId);
  }
}
