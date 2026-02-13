import type { Response } from 'express';
import Task from '../../../models/Task.ts';
import type { AuthRequest } from '../../../interfaces/AuthRequest';
import logger from '../../../utils/logger.ts';

export const getAllTasks = async (req: AuthRequest, res: Response) => {
	const tasks = await Task.find({ user: req.user!._id });
	logger.info(`Fetched all tasks for user ${req.user!._id}`);
	res.status(200).json(tasks);
};

export default getAllTasks;
