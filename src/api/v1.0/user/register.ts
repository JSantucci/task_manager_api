import type { Request, Response } from 'express';
import User from '../../../models/User.ts';
import { validationResult } from 'express-validator';
import logger from '../../../utils/logger.ts';
import { MongoServerError } from 'mongodb';

export const register = async (req: Request, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		logger.warn(`User registration validation failed: ${JSON.stringify(errors.array())}`);
		return res.status(400).json({ errors: errors.array() });
	}

	const { username, email, password } = req.body;
	try {
		await User.create({ username, email, password });
		logger.info(`User registered: ${email}`);
		return res.status(201).json({ message: 'User registered successfully' });
	} catch (err: unknown) {
		const maybe = err as MongoServerError;
		if (maybe && maybe.code === 11000) {
			logger.warn(`Duplicate registration attempt for email: ${email}`);
			return res.status(400).json({ error: 'Email already registered' });
		}
		logger.error(`User registration failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default register;
