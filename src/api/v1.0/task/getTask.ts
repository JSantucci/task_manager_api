import type { Response } from 'express';
import Task from '../../../models/Task.ts';
import type { AuthRequest } from '../../../interfaces/AuthRequest';
import logger from '../../../utils/logger.ts';

export const getTask = async (req: AuthRequest, res: Response) => {
	const params = req.params as Record<string, string | undefined>;
	const id = params.id ?? params.taskId;
	try {
		const task = await Task.findOne({ _id: id, user: req.user!._id });
		if (!task) {
			logger.warn(`Task not found: ${id} for user ${req.user!._id}`);
			return res.status(404).json({ error: 'Task not found' });
		}
		logger.info(`Fetched task ${id} for user ${req.user!._id}`);
		return res.status(200).json(task);
	} catch (err: unknown) {
		logger.error(`Get task failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default getTask;
