import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Res,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateFieldDto } from './dto/update-field-name.dto';
import { Response } from 'express';
@Controller('tables')
export class TablesController {
  constructor(private readonly createTableService: TablesService) {}

  @Post()
  create(@Body() createCreateTableDto: CreateTableDto) {
    return this.createTableService.create(createCreateTableDto);
  }

  @Get()
  async findAll(@Res() res: Response) {
    const tables = await this.createTableService.findAll();

    //The Content-Range
    return res
      .setHeader('Content-Range', `tables 0-${tables.length}/${tables.length}`)
      .send(tables);
  }

  @Get(':tableName')
  findOne(@Param('tableName') tableName: string) {
    return this.createTableService.findOne(tableName);
  }

  @Delete(':tableName')
  remove(@Param('tableName') tableName: string) {
    return this.createTableService.remove(tableName);
  }

  @Put(':tableName')
  renameField(
    @Param('tableName') tableName: string,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.createTableService.renameField({
      newFieldName: updateFieldDto.newName,
      oldFieldName: updateFieldDto.oldName,
      tableName,
    });
  }
}
