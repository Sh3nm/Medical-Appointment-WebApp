import { IsNotEmpty, IsString, IsEmail, IsNumber } from "class-validator";
import { Role } from "@prisma/client";

export class JwtPayloadDto {
    @IsNotEmpty()
    @IsNumber()
    sub: number;

    @IsNotEmpty()
    @IsString()
    email: string;

    @IsNotEmpty()
    role: Role;
}