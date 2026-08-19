import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { CopilotService } from './copilot.service';

export class CopilotQueryDto {
  @ApiProperty({ example: 'Compare Slim Hadj et Hazem Ayachi', description: 'Requête en langage naturel' })
  query: string;

  @ApiProperty({ required: false, description: 'Contexte des candidats' })
  contextCandidates?: any[];
}

@ApiTags('IA Copilot RH')
@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('query')
  @ApiOperation({ summary: 'Soumettre une requête en langage naturel au Copilot RH' })
  @ApiResponse({ status: 200, description: 'Réponse intelligente et recommandations de l\'IA Copilot RH.' })
  async queryCopilot(@Body() body: CopilotQueryDto) {
    return this.copilotService.processQuery(body);
  }
}
