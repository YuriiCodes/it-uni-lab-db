import { ArrayMinSize, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";


export class Column {
  @IsString()
  name: string;

  @IsString()
  type: string;
}

export class CreateTableDto {
  @IsString()
  tableName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Column)
  columns: Column[];
}
