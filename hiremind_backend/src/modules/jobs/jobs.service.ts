import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobOffer, JobOfferDocument } from './job.schema';

const DEFAULT_SEEDS = [
  {
    id: 'job_018273',
    title: 'Ingénieur Cybersécurité & SIEM',
    department: 'Sécurité & Infrastructure',
    location: 'Paris / Tunis (Hybride)',
    salaryRange: '52 000 € - 65 000 €',
    description: 'Surveillance SOC, audit d’infrastructures Linux, configuration de règles Wazuh SIEM et durcissement Ansible.',
    skillsRequired: ['Wazuh SIEM', 'Pentesting', 'Hardening Linux', 'Ansible', 'Wireshark'],
    softSkills: ['Rigueur', 'Analyse de crise', 'Communication'],
    candidateCount: 4,
    createdAt: '2026-08-20',
    qdrantVectorIndexed: true,
  },
  {
    id: 'job_018274',
    title: 'Cloud DevOps Engineer (Kubernetes)',
    department: 'Cloud & Platform',
    location: 'Lyon (Hybride)',
    salaryRange: '55 000 € - 70 000 €',
    description: 'Conception et automatisation des clusters Kubernetes, pipelines CI/CD SecOps et infrastructure as code Terraform.',
    skillsRequired: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD'],
    softSkills: ['Autonomie', 'Esprit d\'équipe', 'Proactivité'],
    candidateCount: 3,
    createdAt: '2026-08-22',
    qdrantVectorIndexed: true,
  },
  {
    id: 'job_018275',
    title: 'Développeur Backend Senior NestJS',
    department: 'Engineering Software',
    location: 'Remote 100%',
    salaryRange: '50 000 € - 62 000 €',
    description: 'Développement d’API REST microservices avec NestJS, PostgreSQL et intégration de modèles LLM locaux.',
    skillsRequired: ['NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'Clean Architecture'],
    softSkills: ['Pragmatisme', 'Code Review', 'Mentorat'],
    candidateCount: 5,
    createdAt: '2026-08-23',
    qdrantVectorIndexed: true,
  },
  {
    id: 'job_018276',
    title: 'Développeur Mobile Flutter & Dart',
    department: 'Mobile & Frontend Engineering',
    location: 'Tunis (Hybride)',
    salaryRange: '45 000 € - 58 000 €',
    description: 'Développement d’applications mobiles cross-platform avec Flutter, Clean Architecture et intégration IA adaptative.',
    skillsRequired: ['Flutter', 'Dart', 'Clean Architecture', 'Dio', 'REST API', 'Git'],
    softSkills: ['Créativité', 'Autonomie', 'Qualité logicielle'],
    candidateCount: 2,
    createdAt: '2026-08-25',
    qdrantVectorIndexed: true,
  },
];

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private memoryFallback: any[] = [...DEFAULT_SEEDS];

  constructor(
    @InjectModel(JobOffer.name) private jobModel: Model<JobOfferDocument>
  ) {}

  async onModuleInit() {
    try {
      const count = await this.jobModel.countDocuments();
      if (count === 0) {
        await this.jobModel.insertMany(DEFAULT_SEEDS);
        this.logger.log(`Initialized MongoDB with ${DEFAULT_SEEDS.length} default job offers.`);
      }
    } catch (err) {
      this.logger.warn(`MongoDB not accessible, using memory fallback for Jobs.`);
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const jobs = await this.jobModel.find().lean();
      if (jobs && jobs.length > 0) {
        return jobs;
      }
      return this.memoryFallback;
    } catch (err) {
      return this.memoryFallback;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const job = await this.jobModel.findOne({ id }).lean();
      if (job) return job;
    } catch (_) {}
    return this.memoryFallback.find((j) => j.id === id) || this.memoryFallback[0];
  }

  async create(jobData: any): Promise<any> {
    try {
      const created = await this.jobModel.create(jobData);
      this.memoryFallback.unshift(jobData);
      return created.toObject ? created.toObject() : jobData;
    } catch (err) {
      this.memoryFallback.unshift(jobData);
      return jobData;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.jobModel.deleteOne({ id });
      this.memoryFallback = this.memoryFallback.filter((j) => j.id !== id);
      return true;
    } catch (err) {
      this.memoryFallback = this.memoryFallback.filter((j) => j.id !== id);
      return true;
    }
  }
}
