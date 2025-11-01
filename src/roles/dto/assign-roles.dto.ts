import { IsString } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  employeeId: string;

  @IsString()
  roleId: string; // Un solo rol (no array)
}
