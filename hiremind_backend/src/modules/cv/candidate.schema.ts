import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: 'Non renseigné' })
  phone: string;

  @Prop({ required: true })
  roleApplied: string;

  @Prop({ default: 85 })
  matchScore: number;

  @Prop({ default: 'parsed' })
  status: string; // 'sourcing' | 'parsed' | 'tech_interview' | 'hr_interview' | 'hired' | 'rejected'

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: Array, default: [] })
  radarScores: any[];

  @Prop({ default: () => new Date().toISOString().split('T')[0] })
  appliedDate: string;

  @Prop({ default: 2 })
  experienceYears: number;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: Array, default: [] })
  interviewHistory: any[];
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);
