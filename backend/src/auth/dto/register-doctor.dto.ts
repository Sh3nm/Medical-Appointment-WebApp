import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDoctorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  specialization: string; 
}