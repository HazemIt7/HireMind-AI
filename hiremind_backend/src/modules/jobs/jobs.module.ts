import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { QdrantService } from './qdrant.service';
import { JobOffer, JobOfferSchema } from './job.schema';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobOffer.name, schema: JobOfferSchema }]),
    forwardRef(() => CvModule)
  ],
  controllers: [JobsController],
  providers: [JobsService, QdrantService],
  exports: [JobsService, QdrantService],
})
export class JobsModule {}
