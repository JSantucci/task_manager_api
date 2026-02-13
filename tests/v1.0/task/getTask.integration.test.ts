import express from 'express';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import expectExpressValidatorError from '../../utils/expectExpressValidatorError';
import createTestUser from '../../utils/createTestUser';
import getTask from '../../../src/api/v1.0/task/getTask';
import { authenticateJWT } from '../../../src/middleware/auth';
import Task from '../../../src/models/Task';
import { validateTaskId } from '../../../src/middleware/validators/task/validateTaskId';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
const path = '/v1.0/task/:id';
app.get(path, validateTaskId, authenticateJWT, getTask);

const jwtSecret = 'testSecret';
vi.stubEnv('JWT_SECRET', jwtSecret);
const jwtVerifySpy = vi.spyOn(jwt, 'verify');
const taskFindOneSpy = vi.spyOn(Task, 'findOne');
console.error = vi.fn();

let userId: string;
let token: string;

describe('Get Task Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		const result = await createTestUser('testuser', 'test@test.com', 'password');
		userId = result.userId;
		token = result.token;
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});

	describe('Authorization', () => {
		it('should return 401 if no token is provided', async () => {
			const response = await supertest(app).get(
				path.replace(':id', '603d2f4e4f1a2c001f8b4567'),
			);
			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneSpy).not.toHaveBeenCalled();
		});

		it('should return 401 if an invalid token is provided', async () => {
			const invalidToken = 'invalidToken';
			const response = await supertest(app)
				.get(path.replace(':id', '603d2f4e4f1a2c001f8b4567'))
				.set('Authorization', `Bearer ${invalidToken}`);
			expect(response.status).toBe(401);
			expect(jwtVerifySpy).toHaveBeenCalledWith(invalidToken, jwtSecret);
			expect(response.body).toEqual({ error: 'Unauthorized' });
		});
	});

	describe('Successful Cases', () => {
		it('should get a task successfully', async () => {
			// Insert a task into the in-memory database
			const mockedTask = await Task.create({
				title: 'Test task',
				description: 'Test task description',
				status: 'pending',
				priority: 'low',
				deadline: '2036-03-23T00:00:00.000Z',
				user: userId,
			});

			const taskId = mockedTask._id.toString();
			const response = await supertest(app)
				.get(path.replace(':id', taskId))
				.set('Authorization', `Bearer ${token}`);

			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(response.status).toBe(200);
			expect(response.body.id).toBe(taskId);
			expect(response.body.user).toBe(userId);
			expect(response.body.title).toBe(mockedTask.title);
			expect(response.body.description).toBe(mockedTask.description);
			expect(response.body.status).toBe(mockedTask.status);
			expect(response.body.priority).toBe(mockedTask.priority);
			expect(response.body.deadline).toBe(mockedTask.deadline.toISOString());
			expect(taskFindOneSpy).toHaveBeenCalledWith({
				_id: taskId,
				user: new Types.ObjectId(userId),
			});
		});
	});

	describe('Failure Cases', () => {
		it('should return a 400 error for invalid taskId format', async () => {
			const response = await supertest(app)
				.get(path.replace(':id', 'invalidTaskId'))
				.set('Authorization', `Bearer ${token}`);
			expectExpressValidatorError(response, 'id', 'params');
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneSpy).not.toHaveBeenCalled();
		});

		it('should return a 404 error for non-existing taskId', async () => {
			const nonExistingTaskId = '603d2f4e4f1a2c001f8b4567';
			const response = await supertest(app)
				.get(path.replace(':id', nonExistingTaskId))
				.set('Authorization', `Bearer ${token}`);
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(response.status).toBe(404);
			expect(response.body).toEqual({ error: 'Task not found' });
			expect(taskFindOneSpy).toHaveBeenCalledWith({
				_id: nonExistingTaskId,
				user: new Types.ObjectId(userId),
			});
		});

		it('should fail when no taskId is provided', async () => {
			const response = await supertest(app)
				.get(path.replace(':id', ''))
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(404);
			expect(response.body).toEqual({});
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneSpy).not.toHaveBeenCalled();
		});

		it('should return a 500 error for database error', async () => {
			const taskId = '603d2f4e4f1a2c001f8b4567';
			taskFindOneSpy.mockImplementationOnce(() => {
				throw new Error('Database error');
			});
			const response = await supertest(app)
				.get(path.replace(':id', taskId))
				.set('Authorization', `Bearer ${token}`);
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(response.status).toBe(500);
			expect(response.body).toEqual({ error: 'Internal Server Error' });
			expect(taskFindOneSpy).toHaveBeenCalledWith({
				_id: taskId,
				user: new Types.ObjectId(userId),
			});
		});
	});
});
