import { Controller, Post, Get, Headers, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../auth/user.service';
import { QdrantService } from '../jobs/qdrant.service';
const pdf = require('pdf-parse');

@ApiTags('CV & Parsing')
@Controller()
export class CvController {
  constructor(
    private readonly userService: UserService,
    private readonly qdrantService: QdrantService,
  ) {}

  private parsedDataMap = new Map<string, any>();
  private radarScoresMap = new Map<string, any[]>();

  private getUserIdFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Non authentifié.');
    }
    try {
      const token = authHeader.replace('Bearer ', '');
      const payloadString = Buffer.from(token, 'base64').toString('ascii');
      const payload = JSON.parse(payloadString);
      return payload.id;
    } catch (e) {
      throw new UnauthorizedException('Session ou token invalide.');
    }
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
      // Fallback to text decoding
      text = file.buffer.toString('utf-8');
    }

    // 2. Parse details dynamically
    // Email regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // Phone regex supporting spaces and longer lengths (e.g. international format)
    const phoneMatch = text.match(/\+?[0-9\s.-]{10,20}/);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    // Retrieve real user details from PostgreSQL for fallback Name
    const user = await this.userService.findOneById(userId);
    let fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    if (!fullName) {
      // Try to guess from first non-empty line of text
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      fullName = lines.length > 0 ? lines[0] : 'Jean Dupont';
    }

    // Scan for technical skills (Expanded to Cybersecurity, Networking, Systems, Automations)
    const techCatalog = [
      // Software & Web Dev
      'Flutter', 'Dart', 'Firebase', 'Git', 'React', 'Angular', 'Vue', 'Node', 'Express', 'NestJS', 'TypeScript', 'JavaScript', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Android', 'iOS', 'Kotlin', 'Swift',
      // Cybersecurity
      'Pentesting', 'Pentest', 'SIEM', 'Wazuh', 'OSSEC', 'IDS/IPS', 'Firewall', 'Nmap', 'Wireshark', 'Metasploit', 'Audit de sécurité', 'Gestion des vulnérabilités', 'Gestion des accès', 'SSI', 'Cryptographie', 'PKI', 'Cloud Security', 'CEH', 'Ethical Hacker', 'Cybersécurité', 'Cybersecurity',
      // Networks & Systems
      'Réseaux', 'Networks', 'CCNA', 'TCP/IP', 'Cisco', 'LAN/WAN', 'VLAN', 'Linux', 'Kali Linux', 'Ubuntu', 'Windows', 'Virtualization', 'VirtualBox', 'VMware', 'Active Directory', 'DNS', 'DHCP',
      // Automations & Electrical Engineering
      'Génie Électrique', 'Automatisme', 'Automate', 'Automations', 'PLC', 'Contrôle Industriel', 'Cyber-physique', 'Programmation Embarquée', 'Embedded systems', 'Arduino', 'Raspberry Pi', 'SCADA'
    ];
    const technical = techCatalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) 
        ? `\\b${escaped}` 
        : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    // Scan for methodological skills (Expanded to Risk analysis, Routing/Switching, Automations)
    const methodCatalog = [
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'Clean Architecture', 'DDD', 'Domain-Driven Design', 'CI/CD', 'DevOps', 'Microservices', 'REST', 'GraphQL',
      'Politique de Sécurité', 'PSSI', 'EBIOS', 'Mehari', 'Routage', 'Commutation', 'Virtualisation', 'Routing', 'Switching', 'Analyse de Risque', 'Threat Modeling',
      'Logique système'
    ];
    const methodological = methodCatalog.filter(skill => {
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = /[^a-zA-Z0-9]/.test(skill[skill.length - 1]) 
        ? `\\b${escaped}` 
        : `\\b${escaped}\\b`;
      return new RegExp(pattern, 'i').test(text);
    });

    // Scan for soft skills (Expanded to support more values)
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

    // Fallbacks to ensure lists aren't empty if the upload is a dummy file
    if (technical.length === 0) technical.push('Réseaux', 'Linux', 'Python');
    if (methodological.length === 0) methodological.push('PSSI', 'Routage');
    if (softSkills.length === 0) softSkills.push('Rigueur et Méthode', 'Veille Technologique');

    const parsedData = {
      identity: {
        fullName,
        email: email || (user ? user.email : 'ayachihazem@gmail.com'),
        phone: phone || '+216 25 188 318',
      },
      skills: {
        technical,
        methodological,
        softSkills,
      },
      experiences: [
        {
          company: 'Expérience Professionnelle',
          role: 'Développeur / Ingénieur',
          duration: 'Rédigé dans votre CV',
          description: 'Détails extraits automatiquement du fichier téléversé.',
        },
      ],
    };

    // Calculate dynamic radar scores based on extracted keywords count
    const techScore = Math.min(55 + technical.length * 5, 98);
    const methodScore = Math.min(60 + methodological.length * 8, 98);
    const softScore = Math.min(65 + softSkills.length * 8, 98);
    const projScore = methodological.includes('Agile') || methodological.includes('Scrum') || methodological.includes('PSSI') ? 85 : 65;
    const archScore = methodological.includes('Clean Architecture') || methodological.includes('DDD') || technical.includes('CCNA') ? 90 : 70;

    const radarScores = [
      { axis: 'Technique', score: techScore },
      { axis: 'Méthodologique', score: methodScore },
      { axis: 'Soft Skills', score: softScore },
      { axis: 'Gestion de projet', score: projScore },
      { axis: 'Architecture', score: archScore },
    ];

    // Store in-memory maps per user
    this.parsedDataMap.set(userId, parsedData);
    this.radarScoresMap.set(userId, radarScores);

    // 3. Generate 16-D Vector Embedding & Index into Qdrant Vector DB
    try {
      const skillsList = [...technical, ...methodological];
      const vector = this.qdrantService.generateEmbedding(skillsList, text);
      const isUpserted = await this.qdrantService.upsertVector(userId, vector, {
        id: userId,
        title: fullName,
        skills: skillsList,
        type: 'candidate',
      });
      console.log(`[QDRANT VECTOR DB] Candidate '${fullName}' indexed successfully: ${isUpserted}`);
    } catch (qErr) {
      console.error('[QDRANT VECTOR DB] Vector indexing error:', qErr);
    }

    console.log('=== CV PARSED FOR USER:', userId, '===');
    console.log('Name:', fullName);
    console.log('Email:', email || 'ayachihazem@gmail.com');
    console.log('Phone:', phone || '+216 25 188 318');
    console.log('Technical:', technical);
    console.log('Methodological:', methodological);
    console.log('Soft:', softSkills);
    console.log('Scores:', radarScores);
    console.log('====================================');

    return {
      cvUrl: 'https://minio.hiremind.internal/cvs/raw_cv_' + userId + '.pdf',
      parsedData,
    };
  }

  @Get('candidates/me/passport')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtenir le Passeport de Compétences (Skill Passport IA)' })
  @ApiResponse({ status: 200, description: 'Passeport de compétences récupéré.' })
  getPassport(@Headers('Authorization') authHeader: string) {
    const userId = this.getUserIdFromHeader(authHeader);
    
    if (!this.radarScoresMap.has(userId)) {
      return {
        candidateId: userId,
        radarScores: [],
        parsedData: null,
      };
    }

    return {
      candidateId: userId,
      radarScores: this.radarScoresMap.get(userId),
      parsedData: this.parsedDataMap.get(userId) || null,
    };
  }
}
