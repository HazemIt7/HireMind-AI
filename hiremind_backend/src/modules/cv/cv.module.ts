import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { LocalLlmService } from './local-llm.service';

@Module({
  imports: [AuthModule, JobsModule],
  controllers: [CvController],
  providers: [LocalLlmService],
  exports: [LocalLlmService],
})
export class CvModule {}
