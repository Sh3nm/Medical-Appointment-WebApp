import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil Metadata Role yang Diperlukan
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // Cek metadata di method (misalnya @Patch)
      context.getClass(),   // Cek metadata di class (misalnya @Controller)
    ]);

    // Jika tidak ada decorator @Roles() pada endpoint, izinkan akses.
    if (!requiredRoles) {
      return true;
    }

    // 2. Ambil Data User (Role) dari Request
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      // Jika token valid tapi tidak ada role, tolak
      return false; 
    }

    // 3. Verifikasi Otorisasi (RBAC Logic)
    return requiredRoles.some((role) => user.role === role);
  }
}