import { IsObject, IsString } from 'class-validator';

export type CreateColumn = Record<string, any>;
export class CreateRecordDto {
  @IsString()
  tableName: string;

  @IsObject()
  columns: CreateColumn[];
}
