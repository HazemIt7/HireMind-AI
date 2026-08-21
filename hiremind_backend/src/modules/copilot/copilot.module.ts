import { Module } from '@nestjs/common';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { JobsModule } from '../jobs/jobs.module';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [JobsModule, CvModule],
  controllers: [CopilotController],
  providers: [CopilotService],
  exports: [CopilotService],
})
export class CopilotModule {}
