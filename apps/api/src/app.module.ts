import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IamModule } from './iam/iam.module';

@Module({
  imports: [HealthModule, IamModule]
})
export class AppModule {}

