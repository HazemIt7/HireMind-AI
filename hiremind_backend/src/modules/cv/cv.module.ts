import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvController } from './cv.controller';
import { CandidatesService } from './candidates.service';
import { Candidate, CandidateSchema } from './candidate.schema';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { LocalLlmService } from './local-llm.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }]),
    AuthModule,
    forwardRef(() => JobsModule)
  ],
  controllers: [CvController],
  providers: [CandidatesService, LocalLlmService],
  exports: [CandidatesService, LocalLlmService],
})
export class CvModule {}
