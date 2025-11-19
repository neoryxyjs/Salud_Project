import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('JwtAuthGuard.handleRequest:', {
      hasError: !!err,
      hasUser: !!user,
      userEmail: user?.email,
      info: info?.message || 'no info',
    });
    // Si hay un error o no hay usuario, lanzar UnauthorizedException
    if (err || !user) {
      console.error('JwtAuthGuard: Error o usuario faltante', { err, user, info });
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    console.log('✅ JwtAuthGuard: Usuario autenticado correctamente');
    return user;
  }
}

