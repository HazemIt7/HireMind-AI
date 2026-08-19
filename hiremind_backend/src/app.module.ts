import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { CvModule } from './modules/cv/cv.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { CopilotModule } from './modules/copilot/copilot.module';

@Module({
  imports: [
    // Database connection: PostgreSQL via TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'hiremind_user',
      password: 'hiremind_secure_pass',
      database: 'hiremind_auth_billing',
      autoLoadEntities: true,
      synchronize: true, // Only for dev environment
    }),
    // Database connection: MongoDB via Mongoose
    MongooseModule.forRoot('mongodb://admin:admin_secure_pass@localhost:27017/hiremind?authSource=admin'),
    AuthModule,
    CvModule,
    JobsModule,
    InterviewsModule,
    SandboxModule,
    CopilotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

