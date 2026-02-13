import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HydratedDocument, Types } from 'mongoose';
import { reqTask, res, taskId } from '../../utils/unitTestSetup';
import getTask from '../../../src/api/v1.0/task/getTask';
import Task from '../../../src/models/Task';
import { ITask } from '../../../src/interfaces/Task';

vi.mock('../../../src/models/Task', () => ({
	default: {
		findOne: vi.fn(),
	},
}));

console.error = vi.fn();

describe('Get Task Unit Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should get a task successfully', async () => {
		vi.mocked(Task.findOne).mockResolvedValueOnce({
			_id: new Types.ObjectId(taskId),
		} as unknown as HydratedDocument<ITask>);
		await getTask(reqTask as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ _id: new Types.ObjectId(taskId) }),
		);
		expect(Task.findOne).toHaveBeenCalledWith({
			_id: taskId,
			user: reqTask.user!._id,
		});
	});

	it('should fail to get a task when it does not exist', async () => {
		vi.mocked(Task.findOne).mockResolvedValueOnce(null);
		await getTask(reqTask as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ error: 'Task not found' });
	});

	it('should fail to get a task when there is a database error', async () => {
		vi.mocked(Task.findOne).mockRejectedValueOnce(new Error('Database error'));
		await getTask(reqTask as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
	});
});
