import { IsObject } from 'class-validator';

export type CreateColumn = Record<string, any>;
export class CreateRecordDto {
  @IsObject()
  columns: CreateColumn[];
}
