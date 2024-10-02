import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateTableService } from './create-table.service';
import { CreateCreateTableDto } from './dto/create-create-table.dto';
import { UpdateCreateTableDto } from './dto/update-create-table.dto';

@Controller('create-table')
export class CreateTableController {
  constructor(private readonly createTableService: CreateTableService) {}

  @Post()
  create(@Body() createCreateTableDto: CreateCreateTableDto) {
    return this.createTableService.create(createCreateTableDto);
  }

  @Get()
  findAll() {
    return this.createTableService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.createTableService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreateTableDto: UpdateCreateTableDto) {
    return this.createTableService.update(+id, updateCreateTableDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.createTableService.remove(+id);
  }
}
