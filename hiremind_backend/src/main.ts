import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer le préfixe global de versioning
  app.setGlobalPrefix('api/v1');

  // Activer CORS pour permettre les connexions du client Flutter et Web
  app.enableCors();

  // Configurer la documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('HireMind AI Core API')
    .setDescription(
      'Documentation complète de l\'API Core Backend de HireMind AI pour les clients Mobile (Flutter) et Web (Next.js 15).',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrer le token JWT',
        in: 'header',
      },
      'JWT-auth', // Clé d'authentification de sécurité à référencer
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Le Core Backend NestJS tourne sur : http://localhost:${port}/api/v1`);
  console.log(`📄 La documentation Swagger est disponible sur : http://localhost:${port}/api-docs`);
}
bootstrap();

