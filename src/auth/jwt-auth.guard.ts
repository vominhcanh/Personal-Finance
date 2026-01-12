
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const path = request.path;

        // Still keep fallback for /v1/ check if needed, but Public decorator is safer.
        // If path does not start with /v1/ and not decorated, we allow it (as per previous logic).
        // But better to rely on Decorator.
        // Let's keep the existing logic as a secondary check to avoid breaking legacy code.
        if (!path.startsWith('/v1/') && !path.startsWith('/api/v1/')) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
