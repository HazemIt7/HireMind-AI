import { Controller, Post, Get, Patch, Body, Param, Headers, UnauthorizedException, UseInterceptors, UploadedFile, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../auth/user.service';
import { QdrantService } from '../jobs/qdrant.service';
import { LocalLlmService } from './local-llm.service';
import { CandidatesService } from './candidates.service';
const pdf = require('pdf-parse');

@ApiTags('CV, Parsing & Candidats')
@Controller()
export class CvController {
  constructor(
    private readonly userService: UserService,
    private readonly candidatesService: CandidatesService,
    @Inject(forwardRef(() => QdrantService))
    private readonly qdrantService: QdrantService,
    private readonly localLlmService: LocalLlmService,
  ) {}

  private parsedDataMap = new Map<string, any>();
  private radarScoresMap = new Map<string, any[]>();

  private getUserIdFromHeader(authHeader: string): string {
    if (!authHeader) {
      return 'user_default';
    }
    try {
      const token = authHeader.replace('Bearer ', '');
      const payloadString = Buffer.from(token, 'base64').toString('ascii');
      const payload = JSON.parse(payloadString);
      return payload.id || 'user_default';
    } catch (e) {
      return 'user_default';
    }
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Lister tous les candidats du pipeline ATS' })
  @ApiResponse({ status: 200, description: 'Liste des candidats centralisée pour Web & Mobile.' })
  async getCandidates() {
    return await this.candidatesService.findAll();
  }

  @Post('candidates')
  @ApiOperation({ summary: 'Enregistrer ou mettre à jour un candidat' })
  @ApiResponse({ status: 201, description: 'Candidat enregistré avec succès.' })
  async createCandidate(@Body() body: any) {
    const candId = body.id || `cand_${Date.now()}`;
    const candData = {
      ...body,
      id: candId,
      appliedDate: body.appliedDate || new Date().toISOString().split('T')[0]
    };
    return await this.candidatesService.upsert(candData);
  }

  @Patch('candidates/:id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut ATS d\'un candidat' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour.' })
  async updateCandidateStatus(@Param('id') id: string, @Body() body: any) {
    const status = body.status || 'parsed';
    return await this.candidatesService.updateStatus(id, status);
  }

  @Post('cv/upload')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Déposer un CV pour parsing automatique' })
  @ApiResponse({ status: 201, description: 'CV importé et analysé avec succès.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier du CV (Max 5MB).',
        },
      },
    },
  })
  async uploadCv(
    @Headers('Authorization') authHeader: string,
    @UploadedFile() file: any,
  ) {
    const userId = this.getUserIdFromHeader(authHeader);
    if (!file) {
      throw new UnauthorizedException('Fichier de CV manquant.');
    }

    // 1. Extract text content based on mimetype
    let text = '';
    try {
      if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
        const parser = new pdf.PDFParse({ data: file.buffer });
        try {
          const parsedPdf = await parser.getText();
          text = parsedPdf.text || '';
        } finally {
          await parser.destroy();
        }
      } else {
        text = file.buffer.toString('utf-8');
      }
    } catch (err) {
      text = file.buffer.toString('utf-8');
    }

    // 2. Parse details dynamically
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = text.match(/\+?[0-9\s.-]{10,20}/);
    let phone = phoneMatch ? phoneMatch[0].trim() : 'Non renseigné';

    let experienceYears = 2;
    const expMatch = text.match(/(\d+)\s*(?:ans?|years?|expérience|exp)/i);
    if (expMatch && parseInt(expMatch[1]) < 30 && parseInt(expMatch[1]) > 0) {
      experienceYears = parseInt(expMatch[1]);
    }

    const user = await this.userService.findOneById(userId);
    let fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    if (!fullName) {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      fullName = lines.length > 0 ? lines[0] : file.originalname.replace('.pdf', '');
    }

    const techCatalog = [
      'Flutter', 'Dart', 'Firebase', 'Git', 'React', 'Angular', 'Vue', 'Node', 'Express', 'NestJS', 'TypeScript', 'JavaScript', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Android', 'iOS', 'Kotlin', 'Swift',
      'Analyste SOC', 'SOC Analyst', 'SOC', 'SIEM', 'Splunk', 'ELK', 'Elastic Stack', 'Sentinel', 'Microsoft Sentinel', 'Wazuh', 'OSSEC', 'EDR', 'XDR', 'CrowdStrike', 'Falcon', 'Microsoft Defender', 'Defender for Endpoint',
      'Wireshark', 'Zeek', 'tcpdump', 'Nmap', 'Metasploit', 'Pentesting', 'Pentest', 'Firewall', 'Proxy', 'Syslog', 'Windows Event Logs',
      'MITRE ATT&CK', 'MITRE', 'NIST', 'OWASP', 'ISO 27001', 'Sigma', 'YARA', 'Atomic Red Team', 'Volatility', 'Forensics', 'Incident Response', 'Threat Intelligence', 'Phishing',
      'Security+', 'CompTIA Security+', 'Cisco CyberOps', 'CyberOps', 'CEH', 'Ethical Hacker', 'Cybersécurité', 'Cybersecurity', 'Audit de sécurité', 'Gestion des vulnérabilités', 'Cryptographie', 'PKI',
      'Réseaux', 'Networks', 'CCNA', 'TCP/IP', 'Cisco', 'LAN/WAN', 'VLAN', 'VPN', 'DNS', 'DHCP', 'Modèle OSI', 'Linux', 'Kali Linux', 'Ubuntu', 'Debian', 'Windows Server', 'Active Directory', 'VMware', 'VirtualBox', 'Virtualization'
    ];
    const technical = techCatalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) 
        ? `\\b${escaped}` 
        : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    const methodCatalog = [
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'Clean Architecture', 'DDD', 'CI/CD', 'DevOps', 'Microservices', 'REST', 'GraphQL',
      'Politique de Sécurité', 'PSSI', 'EBIOS', 'Threat Modeling', 'Routage', 'Commutation', 'Virtualisation', 'Analyse de Risque', 'Analyse de Logs', 'Triage d\'Alertes'
    ];
    const methodological = methodCatalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) 
        ? `\\b${escaped}` 
        : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    const softCatalog = [
      'Communication', 'Leadership', 'Esprit d\'équipe', 'Teamwork', 'Autonomie', 'Rigueur', 'Adaptabilité', 'Gestion du temps', 'Créativité', 'Résolution de problèmes',
      'Rigueur et Méthode', 'Veille Technologique', 'Curiosité'
    ];
    const softSkills = softCatalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) 
        ? `\\b${escaped}` 
        : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    const llmResult = await this.localLlmService.parseCvWithLocalLlm(text);

    const devKeywords = ['Node', 'NestJS', 'Express', 'TypeScript', 'JavaScript', 'React', 'Angular', 'Vue', 'Flutter', 'Dart', 'Django', 'FastAPI', 'Spring', 'Go', 'Java', 'C++', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'Microservices'];
    const cyberKeywords = ['SOC', 'Analyste SOC', 'SOC Analyst', 'SIEM', 'Splunk', 'ELK', 'Elastic Stack', 'Sentinel', 'Microsoft Sentinel', 'Wazuh', 'OSSEC', 'EDR', 'XDR', 'CrowdStrike', 'Falcon', 'Microsoft Defender', 'Defender for Endpoint', 'Wireshark', 'Zeek', 'tcpdump', 'Nmap', 'Metasploit', 'Pentesting', 'Pentest', 'Firewall', 'MITRE ATT&CK', 'MITRE', 'NIST', 'OWASP', 'ISO 27001', 'Sigma', 'YARA', 'Atomic Red Team', 'Volatility', 'Forensics', 'Incident Response', 'Threat Intelligence', 'Phishing', 'Security+', 'CompTIA Security+', 'Cisco CyberOps', 'CyberOps', 'CEH', 'Cybersécurité', 'Cybersecurity', 'Audit de sécurité'];
    const networkKeywords = ['CCNA', 'Cisco', 'Cisco CyberOps', 'TCP/IP', 'LAN/WAN', 'VLAN', 'VPN', 'DNS', 'DHCP', 'Modèle OSI', 'Wireshark', 'Zeek', 'tcpdump', 'Réseaux', 'Networks'];
    const systemKeywords = ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Linux', 'Ubuntu', 'Debian', 'Windows Server', 'Active Directory', 'VMware', 'VirtualBox', 'Terraform', 'CI/CD', 'DevOps'];

    const devCount = technical.filter(k => devKeywords.includes(k)).length + methodological.filter(k => devKeywords.includes(k)).length;
    const cyberCount = technical.filter(k => cyberKeywords.includes(k)).length + methodological.filter(k => cyberKeywords.includes(k)).length;
    const networkCount = technical.filter(k => networkKeywords.includes(k)).length + methodological.filter(k => networkKeywords.includes(k)).length;
    const systemCount = technical.filter(k => systemKeywords.includes(k)).length + methodological.filter(k => systemKeywords.includes(k)).length;

    const isCyberProfile = llmResult?.primaryDomain === 'Cybersecurity' || cyberCount > devCount;
    const isDevProfile = llmResult?.primaryDomain === 'SoftwareDev' || (!isCyberProfile && devCount >= cyberCount);

    const devScore = isDevProfile ? Math.min(80 + devCount * 3, 98) : Math.min(20 + devCount * 3, 40);
    const cyberScore = isCyberProfile ? Math.min(80 + cyberCount * 3, 98) : Math.min(15 + cyberCount * 3, 35);
    const networkScore = isCyberProfile ? Math.min(65 + networkCount * 5, 90) : Math.min(30 + networkCount * 5, 60);
    const systemScore = Math.min(45 + systemCount * 5, 92);
    const softScore = Math.min(65 + softSkills.length * 7, 95);

    let radarScores = [
      { axis: 'Software Dev', score: devScore, label: 'Software Dev' },
      { axis: 'Cybersecurity', score: cyberScore, label: 'Cybersécurité' },
      { axis: 'Networks', score: networkScore, label: 'Réseaux' },
      { axis: 'Systems', score: systemScore, label: 'Systèmes & DevOps' },
      { axis: 'Soft Skills', score: softScore, label: 'Soft Skills' },
    ];

    const primaryScore = Math.max(devScore, cyberScore, networkScore, systemScore);
    const calculatedMatchScore = Math.max(78, Math.min(98, Math.round((primaryScore * 0.7) + (technical.length * 2))));
    const primaryDomainStr = isCyberProfile ? 'Cybersécurité' : isDevProfile ? 'Développement' : 'Réseaux & Système';

    const parsedData = {
      identity: {
        fullName,
        email: email || (user ? user.email : 'candidat@hiremind.ai'),
        phone,
      },
      fullName,
      email: email || (user ? user.email : 'candidat@hiremind.ai'),
      phone,
      experienceYears,
      matchScore: calculatedMatchScore,
      primaryDomain: primaryDomainStr,
      skills: {
        technical,
        methodological,
        softSkills,
      },
    };

    const textSummary = llmResult?.summary || `Profil extrait automatiquement depuis ${file.originalname}. Domaine: ${primaryDomainStr}, Expérience: ${experienceYears} ans, Compétences clés: ${technical.slice(0, 5).join(', ')}.`;

    this.parsedDataMap.set(userId, { ...parsedData, textSummary, radarScores });
    this.radarScoresMap.set(userId, radarScores);

    // Save candidate in centralized MongoDB Candidates collection
    await this.candidatesService.upsert({
      id: userId,
      fullName,
      email: parsedData.email,
      phone,
      roleApplied: `${primaryDomainStr} Specialist`,
      matchScore: calculatedMatchScore,
      status: 'parsed',
      skills: technical.length > 0 ? technical : ['Compétences Générales'],
      radarScores,
      appliedDate: new Date().toISOString().split('T')[0],
      experienceYears,
      summary: textSummary,
      interviewHistory: []
    });

    // Generate 16-D Vector Embedding & Index into Qdrant Vector DB
    try {
      const skillsList = [...technical, ...methodological];
      const vector = this.qdrantService.generateEmbedding(skillsList, text);
      await this.qdrantService.upsertVector(userId, vector, {
        id: userId,
        title: fullName,
        skills: skillsList,
        type: 'candidate',
      });
    } catch (qErr) {}

    return {
      cvUrl: 'https://minio.hiremind.internal/cvs/raw_cv_' + userId + '.pdf',
      parsedData,
      radarScores,
    };
  }

  @Get('candidates/me/passport')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir le Passeport de Compétences (Skill Passport IA)' })
  @ApiResponse({ status: 200, description: 'Passeport de compétences récupéré.' })
  async getPassport(@Headers('Authorization') authHeader: string) {
    const userId = this.getUserIdFromHeader(authHeader);
    
    if (this.radarScoresMap.has(userId)) {
      return {
        candidateId: userId,
        radarScores: this.radarScoresMap.get(userId),
        parsedData: this.parsedDataMap.get(userId) || null,
      };
    }

    const cand = await this.candidatesService.findOne(userId);
    if (cand) {
      return {
        candidateId: userId,
        radarScores: cand.radarScores || [],
        parsedData: {
          fullName: cand.fullName,
          email: cand.email,
          phone: cand.phone,
          skills: { technical: cand.skills || [] },
          textSummary: cand.summary
        }
      };
    }

    return {
      candidateId: userId,
      radarScores: [],
      parsedData: null,
    };
  }
}
