import type { Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../../../interfaces/User.ts';
import User from '../../../models/User.ts';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../../utils/getEnv.ts';
import logger from '../../../utils/logger.ts';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

export const refresh = async (req: Request, res: Response) => {
	try {
		const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
		if (!cookieToken) return res.status(401).json({ error: 'Missing refresh token' });

		// hash incoming token to compare with stored hashes
		const crypto = await import('crypto');
		const tokenHash = crypto.createHash('sha256').update(cookieToken).digest('hex');

		const user = (await User.findOne({
			'refreshTokens.tokenHash': tokenHash,
		})) as HydratedDocument<IUser> | null;
		if (!user) {
			logger.warn('Refresh token not found');
			return res.status(401).json({ error: 'Invalid refresh token' });
		}
		const valid = user.findValidRefreshToken(tokenHash);
		if (!valid) {
			// If token is found but invalid (revoked/expired), revoke all tokens as a precaution
			await user.updateOne({ $set: { 'refreshTokens.$[].revoked': true } });
			logger.warn('Refresh token invalid or revoked for user ' + user.email);
			return res.status(401).json({ error: 'Invalid refresh token' });
		}

		// rotate: create a new refresh token and mark old revoked
		const { token: newRefreshToken } = user.rotateRefreshToken(tokenHash, {
			ip: req.ip,
			userAgent: req.get('User-Agent') ?? undefined,
		}) ?? { token: null };
		await user.save();

		if (!newRefreshToken) {
			logger.error('Failed to rotate refresh token');
			return res.status(500).json({ error: 'Failed to refresh token' });
		}

		// issue a new access token
		const secret = process.env.JWT_SECRET ?? JWT_SECRET;
		const accessToken = jwt.sign({ id: user._id, username: user.username }, secret, {
			expiresIn: '15m',
		});

		// set cookie
		const cookieOpts = {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax' as const,
			maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
			path: '/',
		};
		res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOpts);
		return res.json({ token: accessToken });
	} catch (err: unknown) {
		logger.error('Refresh failed: ' + (err as Error).message);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default refresh;
