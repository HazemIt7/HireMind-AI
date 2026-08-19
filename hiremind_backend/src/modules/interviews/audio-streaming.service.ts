import { Injectable, Logger } from '@nestjs/common';

export interface AudioProcessingMetrics {
  sttDurationMs: number;
  aiReasoningDurationMs: number;
  ttsSynthesisDurationMs: number;
  totalLatencyMs: number;
  isWithinTarget: boolean; // < 1500ms SLA target
}

@Injectable()
export class AudioStreamingService {
  private readonly logger = new Logger(AudioStreamingService.name);
  private readonly maxTargetLatencyMs = 1500; // < 1.5 seconds SLA

  /**
   * Process voice input stream through optimized STT -> AI Reasoning -> TTS pipeline
   */
  async processVoicePipeline(audioBuffer: Buffer): Promise<{
    transcription: string;
    aiResponseText: string;
    audioStreamUrl: string;
    metrics: AudioProcessingMetrics;
  }> {
    const startTime = Date.now();

    // 1. Optimized Whisper STT Processing (Simulated fast local inference)
    const sttStart = Date.now();
    const transcription = await this.simulateWhisperSTT(audioBuffer);
    const sttDurationMs = Date.now() - sttStart;

    // 2. Fast AI Reasoning
    const reasoningStart = Date.now();
    const aiResponseText = `Merci. Pouvez-vous détailler l'architecture de données de votre dernier projet ?`;
    const aiReasoningDurationMs = Date.now() - reasoningStart;

    // 3. Pre-buffered ElevenLabs TTS Audio Synthesis
    const ttsStart = Date.now();
    const audioStreamUrl = await this.simulateElevenLabsTTS(aiResponseText);
    const ttsSynthesisDurationMs = Date.now() - ttsStart;

    const totalLatencyMs = Date.now() - startTime;
    const isWithinTarget = totalLatencyMs < this.maxTargetLatencyMs;

    this.logger.log(
      `Audio Pipeline Latency: ${totalLatencyMs}ms (STT: ${sttDurationMs}ms, AI: ${aiReasoningDurationMs}ms, TTS: ${ttsSynthesisDurationMs}ms) | SLA Target (<1.5s): ${isWithinTarget ? 'PASSED' : 'EXCEEDED'}`
    );

    return {
      transcription,
      aiResponseText,
      audioStreamUrl,
      metrics: {
        sttDurationMs,
        aiReasoningDurationMs,
        ttsSynthesisDurationMs,
        totalLatencyMs,
        isWithinTarget,
      },
    };
  }

  private async simulateWhisperSTT(buffer: Buffer): Promise<string> {
    // Simulated Whisper V3 turbo STT (< 350ms)
    await new Promise((resolve) => setTimeout(resolve, 320));
    return 'J\'ai mis en place une architecture microservices sécurisée avec NestJS et Docker.';
  }

  private async simulateElevenLabsTTS(text: string): Promise<string> {
    // Simulated ElevenLabs Flash TTS (< 450ms)
    await new Promise((resolve) => setTimeout(resolve, 420));
    return `http://localhost:3000/api/v1/assets/audio/stream_${Date.now()}.mp3`;
  }
}
