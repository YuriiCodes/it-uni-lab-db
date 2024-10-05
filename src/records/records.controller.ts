import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post(':tableName')
  create(
    @Param('tableName') tableName: string,
    @Body() createRecordDto: CreateRecordDto,
  ) {
    return this.recordsService.create(tableName, createRecordDto);
  }
  @Get(':tableName')
  findOne(@Param('tableName') tableName: string) {
    return this.recordsService.findOne(tableName);
  }

  @Patch(':tableName/:id')
  update(
    @Param('tableName') tableName: string,
    @Param('id') id: number,
    @Body() updateRecordDto: UpdateRecordDto,
  ) {
    return this.recordsService.update(tableName, +id, updateRecordDto);
  }

  @Delete(':tableName/:id')
  remove(@Param('tableName') tableName: string, @Param('id') id: number) {
    return this.recordsService.remove(tableName, id);
  }
}
