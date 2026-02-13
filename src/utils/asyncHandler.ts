import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../interfaces/AuthRequest';

type AsyncHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
	(fn: AsyncHandler) => (req: AuthRequest, res: Response, next: NextFunction) =>
		Promise.resolve(fn(req, res, next)).catch(next);
