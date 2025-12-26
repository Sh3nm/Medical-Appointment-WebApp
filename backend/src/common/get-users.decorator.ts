import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export type JwtUser = {
  sub: number;
  email: string;
  role: Role;
};

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    
    const user = request.user;
    
    return user; 
  },
);