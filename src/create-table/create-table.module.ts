import { Module } from '@nestjs/common';
import { CreateTableService } from './create-table.service';
import { CreateTableController } from './create-table.controller';
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [CreateTableController],
  providers: [CreateTableService, PrismaService],
})
export class CreateTableModule {}
