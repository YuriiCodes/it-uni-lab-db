import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreateTableModule } from './create-table/create-table.module';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [CreateTableModule,
    ConfigModule.forRoot({
      isGlobal: true,
    })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
