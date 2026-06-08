import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FranchiseController } from './franchise.controller';
import { WelfareCardRepository } from './welfare-card.repository';
import { WelfareCardService } from './welfare-card.service';

@Module({
  controllers: [FranchiseController],
  providers: [PrismaService, WelfareCardRepository, WelfareCardService]
})
export class FranchiseModule {}
