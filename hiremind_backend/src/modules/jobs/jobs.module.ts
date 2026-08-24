import { Module, forwardRef } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { QdrantService } from './qdrant.service';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [forwardRef(() => CvModule)],
  controllers: [JobsController],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class JobsModule {}
