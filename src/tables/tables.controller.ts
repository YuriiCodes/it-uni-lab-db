import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateFieldDto } from './dto/update-field-name.dto';

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

  @Delete(':tableName')
  remove(@Param('tableName') tableName: string) {
    return this.createTableService.remove(tableName);
  }

  @Put(':tableName/fields')
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
