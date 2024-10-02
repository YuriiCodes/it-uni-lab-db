import { IsString } from 'class-validator';

export class UpdateFieldDto {
  @IsString()
  oldName: string;

  @IsString()
  newName: string;
}
