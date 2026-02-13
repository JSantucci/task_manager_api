import express from 'express';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import expectExpressValidatorError from '../../utils/expectExpressValidatorError';
import createTestUserAndToken from '../../utils/createTestUser';

import deleteTask from '../../../src/api/v1.0/task/deleteTask';
import { validateTaskId } from '../../../src/middleware/validators/task/validateTaskId';
import { authenticateJWT } from '../../../src/middleware/auth';
import Task from '../../../src/models/Task';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
const path = '/v1.0/task/:id';
app.delete(path, validateTaskId, authenticateJWT, deleteTask);

const jwtSecret = 'testSecret';
vi.stubEnv('JWT_SECRET', jwtSecret);
const jwtVerifySpy = vi.spyOn(jwt, 'verify');
const taskFindOneAndDeleteSpy = vi.spyOn(Task, 'findOneAndDelete');
console.error = vi.fn();

let userId: string;
let token: string;

describe('Delete Task Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		const result = await createTestUserAndToken('testuser', 'test@test.com', 'password');
		userId = result.userId;
		token = result.token;
	});

	beforeEach(async () => {
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});

	describe('Authorization', () => {
		it('should return 401 if no token is provided', async () => {
			const response = await supertest(app).delete(
				path.replace(':id', '67ff95ce036a26e20e4b3303'),
			);
			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneAndDeleteSpy).not.toHaveBeenCalled();
		});

		it('should return 401 if an invalid token is provided', async () => {
			const invalidToken = 'invalidToken';
			const response = await supertest(app)
				.delete(path.replace(':id', '67ff95ce036a26e20e4b3303'))
				.set('Authorization', `Bearer ${invalidToken}`);
			expect(response.status).toBe(401);
			expect(jwtVerifySpy).toHaveBeenCalledWith(invalidToken, jwtSecret);
			expect(response.body).toEqual({ error: 'Unauthorized' });
		});
	});

	describe('Successful Cases', () => {
		it('should delete a task', async () => {
			const mockedTask = {
				title: 'Test task',
				description: 'Test task description',
				status: 'pending',
				priority: 'medium',
				deadline: '2036-03-23T00:00:00.000Z',
				user: userId,
			};
			const createdTask = await Task.create(mockedTask);
			const taskId = createdTask._id.toString();

			const response = await supertest(app)
				.delete(path.replace(':id', taskId))
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Task deleted successfully' });
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskFindOneAndDeleteSpy).toHaveBeenCalledWith({
				_id: taskId,
				user: new Types.ObjectId(userId),
			});
		});
	});

	describe('Failure Cases', () => {
		it('should return a 404 error if the task does not exist', async () => {
			const nonExistentTaskId = '67ff95ce036a26e20e4b3303';
			const response = await supertest(app)
				.delete(path.replace(':id', nonExistentTaskId))
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: 'Task not found' });
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskFindOneAndDeleteSpy).toHaveBeenCalledWith({
				_id: nonExistentTaskId,
				user: new Types.ObjectId(userId),
			});
		});

		it('should return a 400 error for invalid taskId format', async () => {
			const response = await supertest(app)
				.delete(path.replace(':id', 'invalidTaskId'))
				.set('Authorization', `Bearer ${token}`);
			expectExpressValidatorError(response, 'id', 'params');
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneAndDeleteSpy).not.toHaveBeenCalled();
		});

		it('should return a 500 error if there is a database error', async () => {
			taskFindOneAndDeleteSpy.mockRejectedValueOnce(new Error('Server error'));
			const taskId = '67ff95ce036a26e20e4b3303';
			const response = await supertest(app)
				.delete(path.replace(':id', taskId))
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: 'Internal Server Error' });
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskFindOneAndDeleteSpy).toHaveBeenCalledWith({
				_id: taskId,
				user: new Types.ObjectId(userId),
			});
		});
	});
});
