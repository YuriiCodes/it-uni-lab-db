import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Response } from 'express';
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
  async findOne(@Res() res: Response, @Param('tableName') tableName: string) {
    const records: any[] = await this.recordsService.findOne(tableName);
    // content-range
    return res
      .setHeader(
        'Content-Range',
        `records 0-${records.length}/${records.length}`,
      )
      .send(records);
  }

  @Get()
  findAll() {
    return this.recordsService.findAll();
  }

  @Get(':tableName/:id')
  getOne(
    @Param('tableName') tableName: string,
    @Param('id') id: number,
    @Body() updateRecordDto: UpdateRecordDto,
  ) {
    return this.recordsService.findOneById(tableName, +id);
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
