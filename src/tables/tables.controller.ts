import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly createTableService: TablesService) {}

  @Post()
  create(@Body() createCreateTableDto: CreateTableDto) {
    return this.createTableService.create(createCreateTableDto);
  }

  @Get()
  findAll() {
    return this.createTableService.findAll();
  }

  @Delete(':tableName/:id')
  remove(
    @Param('tableName') tableName: string,
    @Param('id') id: number
  ) {
    return this.createTableService.remove(tableName, id);
  }
}
