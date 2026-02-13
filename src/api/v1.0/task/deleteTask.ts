import type { Response } from 'express';
import Task from '../../../models/Task.ts';
import type { AuthRequest } from '../../../interfaces/AuthRequest';
import logger from '../../../utils/logger.ts';

export const deleteTask = async (req: AuthRequest, res: Response) => {
	const { id } = req.params;
	try {
		const task = await Task.findOneAndDelete({ _id: id, user: req.user!._id });
		if (!task) {
			logger.warn(`Task not found for deletion: ${id} for user ${req.user!._id}`);
			return res.status(404).json({ error: 'Task not found' });
		}
		logger.info(`Task deleted: ${id} by user ${req.user!._id}`);
		return res.status(200).json({ message: 'Task deleted successfully' });
	} catch (err: unknown) {
		logger.error(`Task deletion failed: ${(err as Error).message}`);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

export default deleteTask;
