import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TablesModule } from './tables/tables.module';
import { ConfigModule } from "@nestjs/config";
import { RecordsModule } from './records/records.module';

@Module({
  imports: [TablesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RecordsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
