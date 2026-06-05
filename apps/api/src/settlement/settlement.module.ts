import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementController } from './settlement.controller';
import { SettlementRepository } from './settlement.repository';
import { SettlementService } from './settlement.service';

@Module({
  controllers: [SettlementController],
  providers: [PrismaService, SettlementRepository, SettlementService],
  exports: [SettlementRepository, SettlementService]
})
export class SettlementModule {}
