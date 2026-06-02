import { Module } from '@nestjs/common';
import { FranchiseController } from './franchise.controller';

@Module({
  controllers: [FranchiseController]
})
export class FranchiseModule {}
