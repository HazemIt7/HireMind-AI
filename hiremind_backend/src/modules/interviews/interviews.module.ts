import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { AdaptiveInterviewService } from './adaptive-interview.service';
import { AudioStreamingService } from './audio-streaming.service';

@Module({
  controllers: [InterviewsController],
  providers: [AdaptiveInterviewService, AudioStreamingService],
  exports: [AdaptiveInterviewService, AudioStreamingService],
})
export class InterviewsModule {}
