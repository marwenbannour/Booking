import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedActor {
  userId: string;
  sessionId: string;
}

type AuthenticatedRequest = Request & { user?: AuthenticatedActor };

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedActor | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
