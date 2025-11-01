import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';

export enum IdentificationType {
  CC = 'CC',
  CE = 'CE',
  PA = 'PA',
  TE = 'TE',
}

export class RegisterBusinessDto {
  // Datos del negocio
  @IsString()
  businessName: string;

  @IsEmail()
  businessEmail: string;

  @IsString()
  businessPhone: string;

  // Datos del administrador
  @IsString()
  adminFullName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  adminPhone: string;

  @IsString()
  adminIdentificationNumber: string;

  @IsEnum(IdentificationType)
  adminIdentificationType: IdentificationType;

  @IsStrongPassword()
  adminPassword: string;

  // Datos de ubicación
  @IsString()
  locationState: string;

  @IsString()
  locationCity: string;

  @IsString()
  locationPostalCode: string;

  @IsString()
  locationAddress: string;
}
