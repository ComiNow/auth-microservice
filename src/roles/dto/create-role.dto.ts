import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions: string[]; // Array de IDs de módulos
}
