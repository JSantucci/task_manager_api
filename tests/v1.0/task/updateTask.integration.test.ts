import express from 'express';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import expectExpressValidatorError from '../../utils/expectExpressValidatorError';

import updateTask from '../../../src/api/v1.0/task/updateTask';
import { validateUpdateTask } from '../../../src/middleware/validators/task/validateUpdateTask';
import { validateTaskId } from '../../../src/middleware/validators/task/validateTaskId';
import { authenticateJWT } from '../../../src/middleware/auth';
import Task from '../../../src/models/Task';
import jwt from 'jsonwebtoken';
import createTestUserAndToken from '../../utils/createTestUser';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
const path = '/v1.0/task/:id';
app.put(path, validateTaskId, validateUpdateTask, authenticateJWT, updateTask);

const mockedTask = {
	title: 'Test task',
	description: 'Test task description',
	status: 'pending',
	priority: 'low',
	deadline: '2036-03-23T00:00:00.000Z',
	creationDate: new Date('2025-04-08T12:23:16.476Z'),
	user: '',
};
let taskId: string;
const jwtSecret = 'testSecret';
vi.stubEnv('JWT_SECRET', jwtSecret);
const jwtVerifySpy = vi.spyOn(jwt, 'verify');
const taskFindOneAndUpdateSpy = vi.spyOn(Task, 'findOneAndUpdate');
console.error = vi.fn();

let userId: string;
let token: string;

async function successfulUpdate(payload: Partial<typeof Task.schema.obj>) {
	const response = await supertest(app)
		.put(path.replace(':id', taskId))
		.send(payload)
		.set('Authorization', `Bearer ${token}`);
	expect(response.status).toBe(200);
	expect(response.body).toEqual({ message: 'Task updated successfully' });
	expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
	expect(taskFindOneAndUpdateSpy).toHaveBeenCalledWith(
		{ _id: taskId, user: new Types.ObjectId(userId) },
		payload,
		{
			new: true,
		},
	);
}

describe('Update Task Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		const result = await createTestUserAndToken('testuser', 'test@test.com', 'password');
		userId = result.userId;
		token = result.token;
	});

	beforeEach(async () => {
		vi.clearAllMocks();
		// Insert a task into the in-memory database
		mockedTask.user = userId;
		const createdTask = await Task.create(mockedTask);
		taskId = createdTask._id.toString();
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});

	describe('Authorization', () => {
		it('should return 401 if no token is provided', async () => {
			const response = await supertest(app).put(path.replace(':id', taskId)).send({
				title: 'New title',
				priority: 'high',
				deadline: '2030-05-01T00:00:00.000Z',
			});
			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
		});

		it('should return 401 if an invalid token is provided', async () => {
			const invalidToken = 'invalidToken';
			const response = await supertest(app)
				.put(path.replace(':id', taskId))
				.set('Authorization', `Bearer ${invalidToken}`)
				.send({
					title: 'New title',
					priority: 'high',
					deadline: '2030-05-01T00:00:00.000Z',
				});
			expect(response.status).toBe(401);
			expect(jwtVerifySpy).toHaveBeenCalledWith(invalidToken, jwtSecret);
			expect(response.body).toEqual({ error: 'Unauthorized' });
		});
	});

	describe('Successful Cases', () => {
		it('should update a task description only', async () => {
			const payload = {
				title: 'Updated task',
				description: 'Updated task description',
				status: 'completed' as const,
			};
			await successfulUpdate(payload);
		});

		it('should only update a task title', async () => {
			const payload = {
				title: 'Updated task',
			};
			await successfulUpdate(payload);
			const updatedTask = await Task.findById(taskId);
			expect(updatedTask).toBeDefined();
			expect(updatedTask?.title).toBe(payload.title);
			expect(updatedTask?.description).toBe(mockedTask.description);
			expect(updatedTask?.status).toBe(mockedTask.status);
			expect(updatedTask?.deadline.toISOString()).toEqual(mockedTask.deadline);
		});

		it('should only update a task status', async () => {
			const payload = {
				status: 'completed' as const,
			};
			await successfulUpdate(payload);
			const updatedTask = await Task.findById(taskId);
			expect(updatedTask).toBeDefined();
			expect(updatedTask?.status).toBe(payload.status);
			expect(updatedTask?.priority).toBe(mockedTask.priority);
			expect(updatedTask?.title).toBe(mockedTask.title);
			expect(updatedTask?.description).toBe(mockedTask.description);
			expect(updatedTask?.deadline.toISOString()).toEqual(mockedTask.deadline);
		});

		it('should only update a task priority', async () => {
			const payload = {
				priority: 'high' as const,
			};
			await successfulUpdate(payload);
			const updatedTask = await Task.findById(taskId);
			expect(updatedTask).toBeDefined();
			expect(updatedTask?.status).toBe(mockedTask.status);
			expect(updatedTask?.priority).toBe(payload.priority);
			expect(updatedTask?.title).toBe(mockedTask.title);
			expect(updatedTask?.description).toBe(mockedTask.description);
			expect(updatedTask?.deadline.toISOString()).toEqual(mockedTask.deadline);
		});

		it('should only update a task deadline', async () => {
			const payload = {
				deadline: '2027-03-23T00:00:00.000Z',
			};
			await successfulUpdate(payload);
			const updatedTask = await Task.findById(taskId);
			expect(updatedTask).toBeDefined();
			expect(updatedTask?.deadline.toISOString()).toEqual(payload.deadline);
			expect(updatedTask?.title).toBe(mockedTask.title);
			expect(updatedTask?.description).toBe(mockedTask.description);
			expect(updatedTask?.status).toBe(mockedTask.status);
		});
	});

	describe('Failure Cases', () => {
		describe('payload', () => {
			it('should return 400 error for empty payload', async () => {
				const response = await supertest(app)
					.put(path.replace(':id', taskId))
					.set('Authorization', `Bearer ${token}`)
					.send({});
				expect(response.status).toBe(400);
				expect(jwtVerifySpy).not.toHaveBeenCalledWith(token, jwtSecret);
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});

			it('should return 400 error for invalid payload', async () => {
				const response = await supertest(app)
					.put(path.replace(':id', taskId))
					.set('Authorization', `Bearer ${token}`)
					.send({ invalidField: 'invalidValue' });
				expect(response.status).toBe(400);
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});
		});

		describe('taskId', () => {
			it('should return a 400 error for invalid taskId format', async () => {
				const response = await supertest(app)
					.put(path.replace(':id', 'invalid-id'))
					.set('Authorization', `Bearer ${token}`)
					.send({ title: 'New title' });
				expectExpressValidatorError(response, 'id', 'params');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});

			it('should return a 404 error for non-existing taskId', async () => {
				const nonExistingTaskId = '603d2f4e4f1a2c001f8b4567';
				const response = await supertest(app)
					.put(path.replace(':id', nonExistingTaskId))
					.set('Authorization', `Bearer ${token}`)
					.send({ title: 'New title' });
				expect(response.status).toBe(404);
				expect(response.body).toEqual({ error: 'Task not found' });
				expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			});
		});

		describe('status', () => {
			it('should return validation error for invalid status', async () => {
				const payload = {
					status: 'invalid-status' as const,
				};
				const response = await supertest(app)
					.put(path.replace(':id', taskId))
					.set('Authorization', `Bearer ${token}`)
					.send(payload);
				expectExpressValidatorError(response, 'status');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});
		});

		describe('dueDate', () => {
			it('should fail when dueDate is not a valid date', async () => {
				const response = await supertest(app)
					.put(path.replace(':id', taskId))
					.set('Authorization', `Bearer ${token}`)
					.send({ dueDate: 'not valid date' });
				expectExpressValidatorError(response, 'dueDate');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});

			it('should fail when dueDate is in the past', async () => {
				const response = await supertest(app)
					.put(path.replace(':id', taskId))
					.set('Authorization', `Bearer ${token}`)
					.send({ dueDate: '1990-03-23T00:00:00.000Z' });
				expectExpressValidatorError(response, 'dueDate');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskFindOneAndUpdateSpy).not.toHaveBeenCalled();
			});
		});
	});
});
