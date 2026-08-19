export type CandidateStatus = 
  | 'sourcing' 
  | 'parsed' 
  | 'tech_interview' 
  | 'hr_interview' 
  | 'hired' 
  | 'rejected';

export interface SkillScore {
  axis: string;
  score: number; // 0 to 100
  label: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  roleApplied: string;
  matchScore: number; // 0 to 100
  status: CandidateStatus;
  skills: string[];
  radarScores: SkillScore[];
  appliedDate: string;
  experienceYears: number;
  summary: string;
  pdfResumeUrl?: string;
}

export interface KanbanColumn {
  id: CandidateStatus;
  title: string;
  color: string;
  badgeColor: string;
}

export interface RecruiterKPIs {
  activeJobs: number;
  totalCandidates: number;
  avgMatchScore: number;
  timeToHireDays: number;
}
