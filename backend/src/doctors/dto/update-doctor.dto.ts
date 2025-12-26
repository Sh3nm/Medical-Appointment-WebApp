import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  specialization?: string;
}