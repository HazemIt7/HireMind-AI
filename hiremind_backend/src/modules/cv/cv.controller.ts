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
  @ApiOperation({ summary: 'Déposer un CV pour parsing automatique multi-domaines IT' })
  @ApiResponse({ status: 201, description: 'CV importé et analysé avec succès.' })
  async uploadCv(
    @Headers('Authorization') authHeader: string,
    @UploadedFile() file: any,
  ) {
    const userId = this.getUserIdFromHeader(authHeader);
    if (!file) {
      throw new UnauthorizedException('Fichier de CV manquant.');
    }

    // 1. Extract text content from PDF buffer
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

    // 2. Parse Contact Info
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    const phoneMatch = text.match(/\+?[0-9\s.-]{10,20}/);
    let phone = phoneMatch ? phoneMatch[0].trim() : 'Non renseigné';

    let experienceYears = 2;
    const expMatch = text.match(/(\d+)\s*(?:ans?|years?|expérience|exp)/i);
    if (expMatch && parseInt(expMatch[1]) < 30 && parseInt(expMatch[1]) > 0) {
      experienceYears = parseInt(expMatch[1]);
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const user = await this.userService.findOneById(userId);
    let fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    if (!fullName) {
      fullName = lines.length > 0 ? lines[0] : file.originalname.replace('.pdf', '');
    }

    // 3. Comprehensive Multi-Domain IT Skills Catalog
    const dataCatalog = [
      'Data Analyst', 'Data Analyste', 'Data Scientist', 'Data Science', 'Data Engineer', 'Business Intelligence', 'BI', 'Power BI', 'Tableau', 'Looker Studio', 'Looker',
      'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn', 'BigQuery', 'SQL', 'PostgreSQL', 'MySQL', 'R', 'Excel', 'VBA', 'Power Query', 'EDA',
      'Data Mining', 'ETL', 'Data Warehousing', 'Spark', 'Hadoop', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Jupyter', 'Jupyter Notebook'
    ];

    const devopsCatalog = [
      'DevOps', 'Cloud', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Docker', 'Kubernetes', 'K8s', 'Helm', 'CI/CD', 'GitLab CI', 'GitHub Actions', 'Jenkins', 'ArgoCD',
      'Prometheus', 'Grafana', 'ELK', 'Elasticsearch', 'Logstash', 'Kibana', 'Linux', 'Ubuntu', 'RHEL', 'CentOS', 'Debian', 'Bash', 'Nginx', 'IaC', 'Microservices'
    ];

    const devCatalog = [
      'Flutter', 'Dart', 'Node', 'Node.js', 'Express', 'NestJS', 'TypeScript', 'JavaScript', 'React', 'Angular', 'Vue', 'Python', 'Django', 'FastAPI', 'Flask',
      'Java', 'Spring', 'Spring Boot', 'Go', 'Golang', 'Rust', 'C++', 'C#', '.NET', 'GraphQL', 'REST', 'API REST', 'Clean Architecture', 'DDD', 'TDD',
      'MongoDB', 'Redis', 'Firebase', 'Git', 'Android', 'iOS', 'Kotlin', 'Swift'
    ];

    const cyberCatalog = [
      'SOC', 'Analyste SOC', 'SOC Analyst', 'SIEM', 'Splunk', 'Wazuh', 'OSSEC', 'Sentinel', 'Microsoft Sentinel', 'EDR', 'XDR', 'CrowdStrike', 'Falcon', 'Microsoft Defender',
      'Defender for Endpoint', 'Wireshark', 'Zeek', 'tcpdump', 'Nmap', 'Metasploit', 'Pentesting', 'Pentest', 'Firewall', 'Proxy', 'MITRE ATT&CK', 'MITRE', 'NIST', 'OWASP',
      'ISO 27001', 'Sigma', 'YARA', 'Atomic Red Team', 'Volatility', 'Forensics', 'Incident Response', 'Threat Intelligence', 'Phishing', 'Security+', 'CompTIA Security+',
      'Cisco CyberOps', 'CyberOps', 'CEH', 'Ethical Hacker', 'Cybersécurité', 'Cybersecurity', 'Audit de sécurité', 'Gestion des vulnérabilités', 'SonarQube'
    ];

    const networkCatalog = [
      'CCNA', 'Cisco', 'TCP/IP', 'LAN/WAN', 'VLAN', 'VPN', 'DNS', 'DHCP', 'Modèle OSI', 'Réseaux', 'Networks', 'BGP', 'OSPF', 'Routage', 'Commutation', 'Active Directory', 'Windows Server', 'VMware', 'VirtualBox'
    ];

    const methodCatalog = [
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'Clean Architecture', 'DDD', 'CI/CD', 'DevOps', 'Microservices', 'REST', 'GraphQL',
      'Business Intelligence', 'Data Analysis', 'PSSI', 'EBIOS', 'Threat Modeling', 'Analyse de Risque', 'Triage d\'Alertes'
    ];

    const softCatalog = [
      'Communication', 'Leadership', 'Esprit d\'équipe', 'Teamwork', 'Autonomie', 'Rigueur', 'Adaptabilité', 'Gestion du temps', 'Créativité', 'Résolution de problèmes',
      'Esprit critique', 'Communication visuelle', 'Veille Technologique', 'Curiosité', 'Amélioration continue'
    ];

    const extractMatches = (catalog: string[]) => catalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) ? `\\b${escaped}` : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    const technical = [
      ...extractMatches(dataCatalog),
      ...extractMatches(devopsCatalog),
      ...extractMatches(devCatalog),
      ...extractMatches(cyberCatalog),
      ...extractMatches(networkCatalog)
    ].filter((v, i, a) => a.indexOf(v) === i);

    const methodological = extractMatches(methodCatalog).filter((v, i, a) => a.indexOf(v) === i);
    const softSkills = extractMatches(softCatalog).filter((v, i, a) => a.indexOf(v) === i);

    // 4. Invoke Local Ollama LLM for Intelligent Multi-Domain Classification
    const llmResult = await this.localLlmService.parseCvWithLocalLlm(text);

    // 5. Calculate Specific Domain Skill Density
    const dataCount = extractMatches(dataCatalog).length;
    const devopsCount = extractMatches(devopsCatalog).length;
    const devCount = extractMatches(devCatalog).length;
    const cyberCount = extractMatches(cyberCatalog).length;
    const networkCount = extractMatches(networkCatalog).length;

    // 6. Determine Primary Domain Accurately
    let primaryDomain: 'DataAnalytics' | 'DevOps' | 'SoftwareDev' | 'Cybersecurity' | 'Networks' = 'SoftwareDev';

    if (llmResult?.primaryDomain) {
      primaryDomain = llmResult.primaryDomain;
    } else {
      // Robust NLP frequency heuristic
      if (dataCount >= 3 && dataCount >= cyberCount && dataCount >= devopsCount) {
        primaryDomain = 'DataAnalytics';
      } else if (devopsCount >= 3 && devopsCount >= cyberCount && devopsCount >= devCount) {
        primaryDomain = 'DevOps';
      } else if (cyberCount >= 3 && cyberCount >= devCount) {
        primaryDomain = 'Cybersecurity';
      } else if (networkCount >= 3 && networkCount >= devCount) {
        primaryDomain = 'Networks';
      } else {
        primaryDomain = 'SoftwareDev';
      }
    }

    // 7. Extract Exact Target Role
    let roleApplied = '';
    if (llmResult?.targetRole && llmResult.targetRole.trim().length > 2) {
      roleApplied = llmResult.targetRole.trim();
    } else {
      // Find title right below candidate's name in first 3 lines
      if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes('@') && !lines[1].includes('+')) {
        roleApplied = lines[1].split('|')[0].trim();
      } else {
        switch (primaryDomain) {
          case 'DataAnalytics':
            roleApplied = 'Data Analyste';
            break;
          case 'DevOps':
            roleApplied = 'Ingénieur DevOps & Cloud';
            break;
          case 'Cybersecurity':
            roleApplied = 'Analyste SOC & Cybersécurité';
            break;
          case 'Networks':
            roleApplied = 'Ingénieur Réseaux & Télécoms';
            break;
          default:
            roleApplied = 'Développeur Fullstack / Backend';
        }
      }
    }

    // 8. Dynamic & Realistic 5-Axis Radar Calculation
    let devScore = 20;
    let cyberScore = 15;
    let networkScore = 20;
    let systemScore = 30;
    let softScore = Math.min(75 + softSkills.length * 4, 95);

    switch (primaryDomain) {
      case 'DataAnalytics':
        devScore = Math.min(85 + (dataCount + devCount) * 2, 98);
        cyberScore = Math.min(10 + cyberCount * 3, 25);
        networkScore = Math.min(10 + networkCount * 3, 25);
        systemScore = Math.min(35 + (dataCount + devopsCount) * 2, 60);
        break;

      case 'DevOps':
        devScore = Math.min(60 + devCount * 3, 78);
        cyberScore = Math.min(30 + cyberCount * 5, 65);
        networkScore = Math.min(70 + networkCount * 4, 88);
        systemScore = Math.min(88 + devopsCount * 3, 98);
        break;

      case 'Cybersecurity':
        devScore = Math.min(45 + devCount * 3, 70);
        cyberScore = Math.min(88 + cyberCount * 3, 98);
        networkScore = Math.min(78 + networkCount * 4, 94);
        systemScore = Math.min(70 + devopsCount * 3, 88);
        break;

      case 'Networks':
        devScore = Math.min(25 + devCount * 3, 50);
        cyberScore = Math.min(40 + cyberCount * 5, 70);
        networkScore = Math.min(88 + networkCount * 4, 98);
        systemScore = Math.min(45 + devopsCount * 3, 70);
        break;

      default: // SoftwareDev
        devScore = Math.min(85 + devCount * 3, 98);
        cyberScore = Math.min(15 + cyberCount * 3, 35);
        networkScore = Math.min(20 + networkCount * 3, 50);
        systemScore = Math.min(55 + devopsCount * 3, 75);
        break;
    }

    const radarScores = [
      { axis: 'Software Dev', score: devScore, label: 'Software Dev & Data' },
      { axis: 'Cybersecurity', score: cyberScore, label: 'Cybersécurité' },
      { axis: 'Networks', score: networkScore, label: 'Réseaux' },
      { axis: 'Systems', score: systemScore, label: 'Systèmes & DevOps' },
      { axis: 'Soft Skills', score: softScore, label: 'Soft Skills' },
    ];

    const primaryScore = Math.max(devScore, cyberScore, networkScore, systemScore);
    const calculatedMatchScore = Math.max(80, Math.min(98, Math.round((primaryScore * 0.7) + (technical.length * 2))));

    const parsedData = {
      identity: {
        fullName: llmResult?.fullName || fullName,
        email: email || (user ? user.email : 'candidat@hiremind.ai'),
        phone,
      },
      fullName: llmResult?.fullName || fullName,
      email: email || (user ? user.email : 'candidat@hiremind.ai'),
      phone,
      roleApplied,
      experienceYears: llmResult?.experienceYears || experienceYears,
      matchScore: calculatedMatchScore,
      primaryDomain,
      skills: {
        technical,
        methodological,
        softSkills,
      },
    };

    const textSummary = llmResult?.summary || `Profil extrait automatiquement depuis ${file.originalname}. Métier: ${roleApplied}, Expérience: ${parsedData.experienceYears} ans, Compétences clés: ${technical.slice(0, 5).join(', ')}.`;

    this.parsedDataMap.set(userId, { ...parsedData, textSummary, radarScores });
    this.radarScoresMap.set(userId, radarScores);

    // Save candidate in centralized MongoDB Candidates collection
    await this.candidatesService.upsert({
      id: userId,
      fullName: parsedData.fullName,
      email: parsedData.email,
      phone,
      roleApplied,
      matchScore: calculatedMatchScore,
      status: 'parsed',
      skills: technical.length > 0 ? technical : ['Compétences Générales'],
      radarScores,
      appliedDate: new Date().toISOString().split('T')[0],
      experienceYears: parsedData.experienceYears,
      summary: textSummary,
      interviewHistory: []
    });

    // Generate 16-D Vector Embedding & Index into Qdrant Vector DB
    try {
      const skillsList = [...technical, ...methodological];
      const vector = this.qdrantService.generateEmbedding(skillsList, text);
      await this.qdrantService.upsertVector(userId, vector, {
        id: userId,
        title: parsedData.fullName,
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

    let cand = await this.candidatesService.findOne(userId);
    if (!cand) {
      const user = await this.userService.findOneById(userId);
      if (user) {
        cand = await this.candidatesService.findOne(user.email);
        if (!cand && user.firstName) {
          const allCands = await this.candidatesService.findAll();
          const fName = user.firstName.toLowerCase();
          cand = allCands.find(c => c.fullName && c.fullName.toLowerCase().includes(fName));
        }
      }
    }

    if (cand) {
      return {
        candidateId: cand.id || userId,
        radarScores: cand.radarScores || [],
        parsedData: {
          fullName: cand.fullName,
          email: cand.email,
          phone: cand.phone,
          roleApplied: cand.roleApplied,
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
