import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password lama minimal 8 karakter' })
  oldPassword?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  newPassword?: string;
}