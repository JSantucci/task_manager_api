import type { Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../../../interfaces/User.ts';
import User from '../../../models/User.ts';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import logger from '../../../utils/logger.ts';
import { JWT_SECRET } from '../../../utils/getEnv.ts';

export const login = async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		logger.warn(`User login validation failed: ${JSON.stringify(errors.array())}`);
		return res.status(400).json({ errors: errors.array() });
	}

	const { email, password } = req.body;
	try {
		const user = (await User.findOne({ email })) as HydratedDocument<IUser> | null;
		if (!user) {
			logger.warn(`Login failed: user not found for email ${email}`);
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			logger.warn(`Login failed: invalid password for email ${email}`);
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		const secret = process.env.JWT_SECRET ?? JWT_SECRET;
		// access token short-lived
		const token = jwt.sign({ id: user._id, username: user.username } as JwtPayload, secret, {
			expiresIn: '15m',
		});

		// create refresh token and persist
		const cookieOpts = {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax' as const,
			maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000,
			path: '/',
		};

		// create refresh token and persist if model method exists (unit tests may mock plain objects)
		try {
			if (typeof user.createRefreshToken === 'function') {
				const userAgent = typeof req.get === 'function' ? req.get('User-Agent') : undefined;
				const { token: refreshToken } = user.createRefreshToken({
					ip: req.ip,
					userAgent,
				});
				await user.save();
				res.cookie('refreshToken', refreshToken, cookieOpts);
			}
		} catch (e) {
			// don't fail login if refresh token storage isn't available; log and continue
			logger.warn('Could not create refresh token: ' + (e as Error).message);
		}

		logger.info(`User logged in: ${email}`);
		return res.json({ token });
	} catch (err: unknown) {
		logger.error(`Login failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default login;
