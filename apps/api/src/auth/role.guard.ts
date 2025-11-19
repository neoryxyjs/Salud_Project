import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('RolesGuard.canActivate:', {
      requiredRoles,
      path: context.switchToHttp().getRequest().path,
    });

    if (!requiredRoles) {
      console.log('✅ RolesGuard: No se requieren roles específicos');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    console.log('RolesGuard: Usuario:', {
      hasUser: !!user,
      userRole: user?.role,
      requiredRoles,
    });
    
    // Si no hay usuario autenticado, lanzar error 401
    if (!user) {
      console.error('❌ RolesGuard: Usuario no autenticado');
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      console.error('❌ RolesGuard: Usuario no tiene los roles requeridos', {
        userRole: user.role,
        requiredRoles,
      });
      throw new UnauthorizedException('No tienes permisos para acceder a este recurso');
    }

    console.log('✅ RolesGuard: Usuario tiene los roles requeridos');
    return true;
  }
}

