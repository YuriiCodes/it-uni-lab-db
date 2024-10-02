import { PartialType } from '@nestjs/mapped-types';
import { CreateCreateTableDto } from './create-create-table.dto';

export class UpdateCreateTableDto extends PartialType(CreateCreateTableDto) {}
