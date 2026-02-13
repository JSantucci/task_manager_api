import type { Response } from 'express';
import Task from '../../../models/Task.ts';
import type { AuthRequest } from '../../../interfaces/AuthRequest';
import logger from '../../../utils/logger.ts';
import { validationResult } from 'express-validator';

export const updateTask = async (req: AuthRequest, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		logger.warn(`Task update validation failed: ${JSON.stringify(errors.array())}`);
		return res.status(400).json({ errors: errors.array() });
	}
	const params = req.params as Record<string, string | undefined>;
	const id = params.id ?? params.taskId;
	const updates = req.body as Record<string, unknown>;
	if (!updates || Object.keys(updates).length === 0) {
		return res.status(400).json({ error: 'No updates provided' });
	}
	try {
		const task = await Task.findOneAndUpdate({ _id: id, user: req.user!._id }, updates, {
			new: true,
		});
		if (!task) {
			logger.warn(`Task not found for update: ${id} for user ${req.user!._id}`);
			return res.status(404).json({ error: 'Task not found' });
		}
		logger.info(`Task updated: ${id} by user ${req.user!._id}`);
		return res.status(200).json({ message: 'Task updated successfully' });
	} catch (err: unknown) {
		logger.error(`Task update failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default updateTask;
