import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobOfferDocument = JobOffer & Document;

@Schema({ timestamps: true })
export class JobOffer {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  salaryRange: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  skillsRequired: string[];

  @Prop({ type: [String], default: [] })
  softSkills: string[];

  @Prop({ default: 0 })
  candidateCount: number;

  @Prop({ default: true })
  qdrantVectorIndexed: boolean;

  @Prop({ default: () => new Date().toISOString().split('T')[0] })
  createdAt: string;
}

export const JobOfferSchema = SchemaFactory.createForClass(JobOffer);
