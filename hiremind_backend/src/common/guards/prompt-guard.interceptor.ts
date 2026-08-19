import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PromptGuardInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PromptGuardInterceptor.name);

  // Blacklisted prompt injection patterns
  private readonly promptInjectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /disregard\s+all\s+prior\s+prompts/i,
    /system\s+prompt\s+override/i,
    /you\s+are\s+now\s+DAN/i,
    /jailbreak/i,
    /bypass\s+safety\s+filter/i,
    /reveal\s+your\s+system\s+instructions/i,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    if (body) {
      const payloadString = JSON.stringify(body);
      for (const pattern of this.promptInjectionPatterns) {
        if (pattern.test(payloadString)) {
          this.logger.warn(`Prompt Injection Attempt Detected! Client IP: ${request.ip}`);
          throw new BadRequestException({
            statusCode: 400,
            error: 'Security Audit Violation',
            message: 'Tentative d\'injection de prompt ou de contournement du système d\'IA détectée.',
          });
        }
      }
    }

    return next.handle();
  }
}
