import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}