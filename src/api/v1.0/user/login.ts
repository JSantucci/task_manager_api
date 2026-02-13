import type { Request, Response } from 'express';
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
		const user = await User.findOne({ email });
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
		const token = jwt.sign({ id: user._id, username: user.username } as JwtPayload, secret, {
			expiresIn: '1d',
		});
		logger.info(`User logged in: ${email}`);
		return res.json({ token });
	} catch (err: unknown) {
		logger.error(`Login failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default login;
