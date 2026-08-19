import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { QdrantService } from './qdrant.service';

@Module({
  controllers: [JobsController],
  providers: [QdrantService],
  exports: [QdrantService],
})
export class JobsModule {}
