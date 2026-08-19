import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [AuthModule, JobsModule],
  controllers: [CvController],
})
export class CvModule {}
