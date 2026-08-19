import { Candidate } from '@/types/recruiter';

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-slim-hadj',
    fullName: 'Slim Hadj',
    email: 'slim.hadj@hiremind.ai',
    phone: '+216 22 345 678',
    roleApplied: 'Ingénieur Cybersécurité & Cloud DevOps',
    matchScore: 94,
    status: 'parsed',
    skills: ['Wazuh SIEM', 'Pentesting', 'Docker', 'Kubernetes', 'AWS', 'NestJS'],
    radarScores: [
      { axis: 'Software Dev', score: 88, label: 'Développement' },
      { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
      { axis: 'Networks', score: 85, label: 'Réseaux' },
      { axis: 'Systems', score: 90, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 89, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-03',
    experienceYears: 4,
    summary: 'Ingénieur spécialisé en Cybersécurité (Wazuh SIEM, Pentesting) et Infrastructures Cloud DevOps (Docker, K8s, AWS).'
  },
  {
    id: 'cand-1',
    fullName: 'Hazem Ayachi',
    email: 'hazem.ayachi@hiremind.ai',
    phone: '+216 29 888 123',
    roleApplied: 'Cybersecurity Analyst & Dev',
    matchScore: 96,
    status: 'parsed',
    skills: ['Pentesting', 'Wazuh SIEM', 'CEH', 'NestJS', 'Flutter'],
    radarScores: [
      { axis: 'Software Dev', score: 90, label: 'Développement' },
      { axis: 'Cybersecurity', score: 95, label: 'Cybersécurité' },
      { axis: 'Networks', score: 85, label: 'Réseaux' },
      { axis: 'Systems', score: 80, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 88, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-01',
    experienceYears: 4,
    summary: 'Spécialiste en cybersécurité offensive et développement d’applications mobiles/backend sécurisées.'
  },
  {
    id: 'cand-2',
    fullName: 'Amine Ben Salem',
    email: 'amine.bensalem@gmail.com',
    phone: '+216 55 432 109',
    roleApplied: 'Fullstack Engineer NestJS/React',
    matchScore: 92,
    status: 'tech_interview',
    skills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL', 'Docker'],
    radarScores: [
      { axis: 'Software Dev', score: 95, label: 'Développement' },
      { axis: 'Cybersecurity', score: 65, label: 'Cybersécurité' },
      { axis: 'Networks', score: 75, label: 'Réseaux' },
      { axis: 'Systems', score: 82, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 90, label: 'Soft Skills' }
    ],
    appliedDate: '2026-07-28',
    experienceYears: 5,
    summary: 'Développeur passionné par les architectures microservices et la haute disponibilité.'
  },
  {
    id: 'cand-3',
    fullName: 'Sarra Mansouri',
    email: 'sarra.m@outlook.com',
    phone: '+216 98 765 432',
    roleApplied: 'DevOps & Network Security',
    matchScore: 89,
    status: 'hr_interview',
    skills: ['CCNA', 'Cisco', 'Kubernetes', 'CI/CD', 'TCP/IP'],
    radarScores: [
      { axis: 'Software Dev', score: 70, label: 'Développement' },
      { axis: 'Cybersecurity', score: 88, label: 'Cybersécurité' },
      { axis: 'Networks', score: 94, label: 'Réseaux' },
      { axis: 'Systems', score: 90, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 85, label: 'Soft Skills' }
    ],
    appliedDate: '2026-07-25',
    experienceYears: 3,
    summary: 'Experte en infrastructures réseau sécurisées et automatisation de déploiement cloud.'
  },
  {
    id: 'cand-4',
    fullName: 'Youssef Trabelsi',
    email: 'youssef.tr@gmail.com',
    phone: '+216 22 111 333',
    roleApplied: 'Ingénieur Automatisme & IoT',
    matchScore: 84,
    status: 'sourcing',
    skills: ['PLC Automates', 'Scada', 'Génie Électrique', 'Python', 'C++'],
    radarScores: [
      { axis: 'Software Dev', score: 75, label: 'Développement' },
      { axis: 'Cybersecurity', score: 60, label: 'Cybersécurité' },
      { axis: 'Networks', score: 80, label: 'Réseaux' },
      { axis: 'Systems', score: 95, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 78, label: 'Soft Skills' }
    ],
    appliedDate: '2026-08-02',
    experienceYears: 2,
    summary: 'Ingénieur spécialisé en systèmes embarqués, automates industriels et supervision SCADA.'
  },
  {
    id: 'cand-5',
    fullName: 'Leila Ghorbel',
    email: 'leila.ghorbel@tech.tn',
    phone: '+216 20 999 888',
    roleApplied: 'AI & Data Scientist',
    matchScore: 97,
    status: 'hired',
    skills: ['Python', 'Qdrant Vector DB', 'PyTorch', 'FastAPI', 'LLM Prompting'],
    radarScores: [
      { axis: 'Software Dev', score: 92, label: 'Développement' },
      { axis: 'Cybersecurity', score: 78, label: 'Cybersécurité' },
      { axis: 'Networks', score: 70, label: 'Réseaux' },
      { axis: 'Systems', score: 85, label: 'Systèmes' },
      { axis: 'Soft Skills', score: 92, label: 'Soft Skills' }
    ],
    appliedDate: '2026-07-20',
    experienceYears: 6,
    summary: 'Chercheuse et ingénieure en IA générative, spécialisée dans les moteurs de recherche vectoriels.'
  }
];
