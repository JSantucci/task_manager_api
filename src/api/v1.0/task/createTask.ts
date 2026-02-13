import type { Response } from 'express';
import Task from '../../../models/Task.ts';
import type { AuthRequest } from '../../../interfaces/AuthRequest';
import logger from '../../../utils/logger.ts';
import { validationResult } from 'express-validator';

export const createTask = async (req: AuthRequest, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		logger.warn(`Task creation validation failed: ${JSON.stringify(errors.array())}`);
		return res.status(400).json({ errors: errors.array() });
	}
	const payload = {
		...(req.body as Record<string, unknown>),
		user: req.user!._id,
	};
	try {
		const created = await Task.create(payload);
		logger.info(`Task created: ${created && created.id} by user ${req.user!._id}`);
		return res.status(201).json(created);
	} catch (err: unknown) {
		logger.error(`Task creation failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default createTask;
