import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SandboxService } from './sandbox.service';

export class ExecutionDto {
  language: 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';
  code: string;
  testSuiteId?: string;
}

@ApiTags('Sandbox Tests Techniques & Anti-Cheat')
@Controller('sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Post('execute')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exécuter de manière sécurisée le code d\'un test technique et détecter la triche' })
  @ApiResponse({ status: 200, description: 'Code exécuté dans le bac à sable. Retourne la sortie, métriques et score anti-triche.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['language', 'code'],
      properties: {
        language: { type: 'string', enum: ['python', 'javascript', 'typescript', 'java', 'cpp'], example: 'python' },
        code: { type: 'string', example: 'def solution(arr):\n    return sorted(list(set(arr)))\nprint(solution([3, 1, 2, 3, 1]))' },
        testSuiteId: { type: 'string', example: 'test_suite_dart_01' },
      },
    },
  })
  async executeCode(@Body() body: ExecutionDto) {
    const defaultCode = body.code || 'print("Hello from HireMind AI Sandbox")';
    const defaultLang = body.language || 'python';
    return this.sandboxService.executeCode({
      language: defaultLang,
      code: defaultCode,
      testSuiteId: body.testSuiteId,
    });
  }
}
