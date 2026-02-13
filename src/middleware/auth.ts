import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../interfaces/AuthRequest.ts';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import User from '../models/User.ts';
import { JWT_SECRET } from '../utils/getEnv.ts';

// Middleware to ensure req.user is present after JWT auth
export function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	next();
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
	// Support both `req.header('Authorization')` (used in tests) and `req.headers.authorization`
	const rawHeader =
		typeof req.header === 'function' ? req.header('Authorization') : req.headers?.authorization;
	const authHeader = typeof rawHeader === 'string' ? rawHeader : undefined;

	if (authHeader) {
		const token = authHeader.split(' ')[1] ?? '';
		try {
			const secret = process.env.JWT_SECRET ?? JWT_SECRET;
			const decoded = jwt.verify(token, secret) as string | JwtPayload;
			if (!decoded || typeof decoded !== 'object')
				return res.status(401).json({ error: 'Unauthorized' });

			const decodedPayload = decoded as JwtPayload;
			const userId =
				(decodedPayload as Record<string, unknown>).id ??
				(decodedPayload as Record<string, unknown>)._id;
			if (!userId) return res.status(401).json({ error: 'Unauthorized' });

			try {
				// In unit tests we may want to skip the DB lookup and use the token payload directly.
				// Use an explicit env flag so integration tests (which also run under NODE_ENV=test)
				// still exercise the real DB path.
				if (process.env.AUTH_SKIP_DB === 'true') {
					req.user = decodedPayload as unknown as AuthRequest['user'];
					return next();
				}

				const user = await User.findById(String(userId));
				if (!user) return res.status(401).json({ error: 'Unauthorized' });
				req.user = user;
				return next();
			} catch (e: unknown) {
				if (e instanceof Error) return res.status(500).json({ message2: e.message });
				return res.status(500).json({ message: 'Unknown error' });
			}
		} catch {
			return res.status(401).json({ error: 'Unauthorized' });
		}
	}

	return res.status(401).json({ error: 'Unauthorized' });
};
