import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate, CandidateDocument } from './candidate.schema';

const DEFAULT_CANDIDATE_SEEDS = [
  {
    id: 'cand_slim_hadj',
    fullName: 'Slim Hadj',
    email: 'slim.hadj@gmail.com',
    phone: '+216 20 123 456',
    roleApplied: 'Ingénieur Cybersécurité & DevOps',
    matchScore: 94,
    status: 'tech_interview',
    skills: ['Wazuh SIEM', 'Pentesting', 'Docker', 'Kubernetes', 'AWS', 'NestJS'],
    radarScores: [
      { axis: 'Software Dev', score: 88, label: 'Développement' },
      { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
      { axis: 'Networks', score: 85, label: 'Réseaux' },
      { axis: 'Systems', score: 90, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 89, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-21',
    experienceYears: 4,
    summary: 'Ingénieur spécialisé en Cybersécurité (Wazuh SIEM, Pentesting) et Infrastructures Cloud DevOps.',
    interviewHistory: [
      {
        step: 1,
        topic: 'Architecture & Fondations',
        question: 'Comment configurez-vous un cluster Wazuh SIEM avec agents Linux durcis ?',
        answer: 'Déploiement avec Ansible, configuration des règles personnalisées XML et mutualisation des logs avec Filebeat.',
        score: 95,
        feedback: 'Excellente maîtrise technique des règles de corrélation SIEM.'
      },
      {
        step: 2,
        topic: 'Pratique & Incident Response',
        question: 'Quelle est votre démarche lors d\'une alerte d\'escalade de privilèges détectée par l\'EDR ?',
        answer: 'Isolation réseau de l\'hôte, extraction de la mémoire vive pour analyse Volatility et analyse des artefacts.',
        score: 93,
        feedback: 'Procédure conforme aux recommandations SOC NIST.'
      },
      {
        step: 3,
        topic: 'Résolution de Crise',
        question: 'Comment automatisez-vous le durcissement de vos pipelines CI/CD ?',
        answer: 'Scan de vulnérabilités Trivy, signature des conteneurs Cosign et vérification des secrets HashiCorp Vault.',
        score: 94,
        feedback: 'Approche DevSecOps très solide.'
      }
    ]
  },
  {
    id: 'cand_hazem_ayachi',
    fullName: 'Hazem Ayachi',
    email: 'candidate@hiremind.ai',
    phone: '+216 25 188 318',
    roleApplied: 'Analyste SOC & Développeur Fullstack',
    matchScore: 96,
    status: 'parsed',
    skills: ['Pentesting', 'Wazuh SIEM', 'CEH', 'NestJS', 'Flutter', 'Dart'],
    radarScores: [
      { axis: 'Software Dev', score: 90, label: 'Développement' },
      { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
      { axis: 'Networks', score: 85, label: 'Réseaux' },
      { axis: 'Systems', score: 80, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 88, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-22',
    experienceYears: 4,
    summary: 'Spécialiste en cybersécurité offensive et développement d’applications mobiles/backend sécurisées.',
    interviewHistory: []
  },
  {
    id: 'cand_alexandre_dubois',
    fullName: 'Alexandre Dubois',
    email: 'alexandre.dubois@gmail.com',
    phone: '+33 6 12 34 56 78',
    roleApplied: 'Cloud DevOps Engineer (Kubernetes)',
    matchScore: 89,
    status: 'parsed',
    skills: ['Docker', 'Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
    radarScores: [
      { axis: 'Software Dev', score: 75, label: 'Développement' },
      { axis: 'Cybersecurity', score: 70, label: 'Cybersécurité' },
      { axis: 'Networks', score: 80, label: 'Réseaux' },
      { axis: 'Systems', score: 94, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 85, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-23',
    experienceYears: 3,
    summary: 'Ingénieur spécialisé dans le déploiement d\'infrastructures conteneurisées et l\'automatisation.',
    interviewHistory: []
  }
];

@Injectable()
export class CandidatesService implements OnModuleInit {
  private readonly logger = new Logger(CandidatesService.name);
  private memoryFallback: any[] = [...DEFAULT_CANDIDATE_SEEDS];

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>
  ) {}

  async onModuleInit() {
    try {
      const count = await this.candidateModel.countDocuments();
      if (count === 0) {
        await this.candidateModel.insertMany(DEFAULT_CANDIDATE_SEEDS);
        this.logger.log(`Initialized MongoDB with ${DEFAULT_CANDIDATE_SEEDS.length} default candidates.`);
      }
    } catch (err) {
      this.logger.warn(`MongoDB not accessible, using memory fallback for Candidates.`);
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const candidates = await this.candidateModel.find().lean();
      if (candidates && candidates.length > 0) {
        return candidates;
      }
      return this.memoryFallback;
    } catch (err) {
      return this.memoryFallback;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const cand = await this.candidateModel.findOne({ id }).lean();
      if (cand) return cand;
    } catch (_) {}
    return this.memoryFallback.find((c) => c.id === id || c.email === id);
  }

  async upsert(candData: any): Promise<any> {
    try {
      const existing = await this.candidateModel.findOne({
        $or: [
          { id: candData.id },
          { email: candData.email },
          { fullName: candData.fullName }
        ]
      });

      if (existing) {
        await this.candidateModel.updateOne({ _id: existing._id }, { $set: candData });
        const idx = this.memoryFallback.findIndex(
          (c) => c.id === candData.id || c.email === candData.email || c.fullName === candData.fullName
        );
        if (idx >= 0) this.memoryFallback[idx] = { ...this.memoryFallback[idx], ...candData };
        return { ...existing.toObject(), ...candData };
      } else {
        const created = await this.candidateModel.create(candData);
        this.memoryFallback.unshift(candData);
        return created.toObject ? created.toObject() : candData;
      }
    } catch (err) {
      const idx = this.memoryFallback.findIndex(
        (c) => c.id === candData.id || c.email === candData.email || c.fullName === candData.fullName
      );
      if (idx >= 0) {
        this.memoryFallback[idx] = { ...this.memoryFallback[idx], ...candData };
      } else {
        this.memoryFallback.unshift(candData);
      }
      return candData;
    }
  }

  async updateStatus(id: string, newStatus: string): Promise<any> {
    try {
      await this.candidateModel.updateOne(
        { $or: [{ id }, { email: id }] },
        { $set: { status: newStatus } }
      );
    } catch (_) {}

    const cand = this.memoryFallback.find((c) => c.id === id || c.email === id);
    if (cand) {
      cand.status = newStatus;
      return cand;
    }
    return null;
  }
}
