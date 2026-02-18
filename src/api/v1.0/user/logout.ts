import type { Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../../../interfaces/User.ts';
import User from '../../../models/User.ts';
import logger from '../../../utils/logger.ts';

const REFRESH_COOKIE_NAME = 'refreshToken';

export const logout = async (req: Request, res: Response) => {
	try {
		const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
		if (!cookieToken) {
			// clear cookie regardless
			res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
			return res.json({ ok: true });
		}

		const crypto = await import('crypto');
		const tokenHash = crypto.createHash('sha256').update(cookieToken).digest('hex');

		const user = (await User.findOne({
			'refreshTokens.tokenHash': tokenHash,
		})) as HydratedDocument<IUser> | null;
		if (user) {
			user.revokeRefreshToken(tokenHash);
			await user.save();
		}

		res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
		logger.info('User logged out');
		return res.json({ ok: true });
	} catch (err: unknown) {
		logger.error('Logout failed: ' + (err as Error).message);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default logout;
