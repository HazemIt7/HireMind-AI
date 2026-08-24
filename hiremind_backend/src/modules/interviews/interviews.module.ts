import { Module, forwardRef } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { AdaptiveInterviewService } from './adaptive-interview.service';
import { AudioStreamingService } from './audio-streaming.service';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [forwardRef(() => CvModule)],
  controllers: [InterviewsController],
  providers: [AdaptiveInterviewService, AudioStreamingService],
  exports: [AdaptiveInterviewService, AudioStreamingService],
})
export class InterviewsModule {}
