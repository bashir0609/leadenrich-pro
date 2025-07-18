import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/AuthService';
import { CustomError, ErrorCode } from '@/types/errors';

// FIX: Update the interface to use the detailed user object structure.
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new CustomError(
        ErrorCode.AUTHENTICATION_ERROR,
        'No authorization header',
        401
      );
    }

    // The payload from the AuthService will contain userId, email, and role
    let payload;

    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        payload = await AuthService.verifyToken(token);
    } else if (authHeader.startsWith('ApiKey ')) {
        const apiKey = authHeader.slice(7);
        payload = await AuthService.validateApiKey(apiKey);
    } else {
        throw new CustomError(
            ErrorCode.AUTHENTICATION_ERROR,
            'Invalid authorization format',
            401
        );
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
       role: payload.role
     };
     next();
    } catch (error) {
    next(error);
 }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(
                new CustomError(
                    ErrorCode.AUTHENTICATION_ERROR,
                    'User not authenticated',
                    401
                )
            );
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(
                new CustomError(
                    ErrorCode.AUTHORIZATION_ERROR,
                    'Insufficient permissions',
                    403
                )
            );
            return;
        }
        next();
    };
};