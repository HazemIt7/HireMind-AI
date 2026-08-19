import { Controller, Post, Get, Body, Param, UseInterceptors } from '@nestjs/common';
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
        candidateName: { type: 'string', example: 'Hazem Ayachi' },
      },
    },
  })
  startInterview(@Body() body: any) {
    const session = this.adaptiveInterviewService.startSession(body.jobId || 'job_018273', body.candidateName);
    return {
      sessionId: session.sessionId,
      jobId: session.jobId,
      currentStep: session.currentStep,
      difficultyLevel: session.difficultyLevel,
      firstQuestion: session.history[0].question,
      topic: session.history[0].topic,
    };
  }

  @Post(':sessionId/message')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Envoyer une réponse textuelle (avec protection anti-prompt injection)' })
  @ApiResponse({ status: 200, description: 'Réponse évaluée et question adaptée générée.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'J\'ai développé une application avec Flutter et BLoC en Clean Architecture.' },
      },
    },
  })
  sendTextMessage(@Param('sessionId') sessionId: string, @Body() body: any) {
    return this.adaptiveInterviewService.processAnswer(sessionId, body.message || '');
  }

  @Post(':sessionId/audio')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envoyer une réponse vocale et optimiser la latence audio (<1.5s SLA)' })
  @ApiResponse({ status: 200, description: 'Audio transcrit, réponse générée et synthétisée sous 1.5s.' })
  async sendVoiceMessage(@Param('sessionId') sessionId: string) {
    const fakeAudioBuffer = Buffer.from('audio_sample_data');
    const audioResult = await this.audioStreamingService.processVoicePipeline(fakeAudioBuffer);
    const adaptiveResult = this.adaptiveInterviewService.processAnswer(sessionId, audioResult.transcription);

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
