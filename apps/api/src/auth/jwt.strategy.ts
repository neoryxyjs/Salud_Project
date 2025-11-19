import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primero intentar desde cookies
        (request) => {
          const token = request?.cookies?.access_token;
          if (token) {
            console.log('✅ JWT encontrado en cookies');
          } else {
            console.log('❌ JWT no encontrado en cookies. Cookies disponibles:', request?.cookies ? Object.keys(request.cookies) : 'none');
          }
          return token;
        },
        // Si no está en cookies, intentar desde el header Authorization
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecreto',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

