import express from 'express';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import expectExpressValidatorError from '../../utils/expectExpressValidatorError';
import createTestUserAndToken from '../../utils/createTestUser';

import createTask from '../../../src/api/v1.0/task/createTask';
import { validateCreateTask } from '../../../src/middleware/validators/task/validateCreateTask';
import { authenticateJWT } from '../../../src/middleware/auth';
import Task from '../../../src/models/Task';
import { Types } from 'mongoose';

const app = express();
app.use(express.json());
const path = '/v1.0/task';
app.post(path, validateCreateTask, authenticateJWT, createTask);

const jwtSecret = 'testSecret';
vi.stubEnv('JWT_SECRET', jwtSecret);
const jwtVerifySpy = vi.spyOn(jwt, 'verify');
const taskCreateSpy = vi.spyOn(Task, 'create');
console.error = vi.fn();

let token: string;
let userId: string;

describe('Create Task Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		const result = await createTestUserAndToken('testuser', 'test@test.com', 'password');
		userId = result.userId;
		token = result.token;
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});
	describe('Authorization', () => {
		it('should return 401 if no token is provided', async () => {
			const response = await supertest(app).post(path).send({
				title: 'Test task',
				priority: 'medium',
				deadline: '2026-03-23T00:00:00.000Z',
			});
			expect(response.status).toBe(401);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(jwtVerifySpy).not.toHaveBeenCalled();
			expect(taskCreateSpy).not.toHaveBeenCalled();
		});

		it('should return 401 if an invalid token is provided', async () => {
			const invalidToken = 'invalidToken';
			const response = await supertest(app)
				.post(path)
				.set('Authorization', `Bearer ${invalidToken}`)
				.send({
					title: 'Test task',
					priority: 'medium',
					deadline: '2026-03-23T00:00:00.000Z',
				});
			expect(response.status).toBe(401);
			expect(jwtVerifySpy).toHaveBeenCalledWith(invalidToken, jwtSecret);
			expect(response.body).toEqual({ error: 'Unauthorized' });
			expect(taskCreateSpy).not.toHaveBeenCalled();
		});
	});

	describe('Successful Cases', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should create a task successfully', async () => {
			const payload = {
				title: 'Test task',
				description: 'Test task description',
				priority: 'low',
				status: 'pending',
				deadline: '2026-03-23T00:00:00.000Z',
			};
			const response = await supertest(app)
				.post(path)
				.send(payload)
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(201);
			const newTask = response.body;
			expect(newTask).toHaveProperty('id');
			expect(newTask).toHaveProperty('title', payload.title);
			expect(newTask).toHaveProperty('description', payload.description);
			expect(newTask).toHaveProperty('status', payload.status);
			expect(newTask).toHaveProperty('priority', payload.priority);
			expect(newTask).toHaveProperty('deadline', payload.deadline);
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskCreateSpy).toHaveBeenCalledWith({
				...payload,
				user: new Types.ObjectId(userId),
			});
		});

		it('should create a task even with no description', async () => {
			const payload = {
				title: 'Test task',
				status: 'pending',
				priority: 'medium',
				deadline: '2026-03-23T00:00:00.000Z',
			};

			const response = await supertest(app)
				.post(path)
				.send(payload)
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(201);
			const newTask = response.body;
			expect(newTask).toHaveProperty('id');
			expect(newTask.description).toBeUndefined();
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskCreateSpy).toHaveBeenCalledWith({
				...payload,
				user: new Types.ObjectId(userId),
			});
		});

		it('should create a task even with no status', async () => {
			const payload = {
				title: 'Test task',
				priority: 'medium',
				description: 'Test task description',
				deadline: '2026-03-23T00:00:00.000Z',
			};

			const response = await supertest(app)
				.post(path)
				.send(payload)
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(201);
			const newTask = response.body;
			expect(newTask).toHaveProperty('id');
			expect(newTask).toHaveProperty('status', 'pending');
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskCreateSpy).toHaveBeenCalledWith({
				...payload,
				user: new Types.ObjectId(userId),
			});
		});

		it('should create a task even with no description and status', async () => {
			const payload = {
				title: 'Test task',
				priority: 'medium',
				deadline: '2026-03-23T00:00:00.000Z',
			};

			const response = await supertest(app)
				.post(path)
				.send(payload)
				.set('Authorization', `Bearer ${token}`);
			expect(response.status).toBe(201);
			const newTask = response.body;
			expect(newTask).toHaveProperty('id');
			expect(newTask.description).toBeUndefined();
			expect(newTask).toHaveProperty('status', 'pending');
			expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
			expect(taskCreateSpy).toHaveBeenCalledWith({
				...payload,
				user: new Types.ObjectId(userId),
			});
		});
	});

	describe('Failure Cases', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		describe('Missing Fields', () => {
			it('should fail when no payload is provided', async () => {
				const response = await supertest(app)
					.post(path)
					.send({})
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'title');
				expectExpressValidatorError(response, 'priority');
				expectExpressValidatorError(response, 'deadline');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});

			it('should fail when no title is provided', async () => {
				const response = await supertest(app)
					.post(path)
					.send({ deadline: '2026-03-23T00:00:00.000Z' })
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'title');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});

			it('should fail when no priority is provided', async () => {
				const response = await supertest(app)
					.post(path)
					.send({ title: 'Test task', deadline: '2026-03-23T00:00:00.000Z' })
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'priority');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});

			it('should fail when no deadline is provided', async () => {
				const response = await supertest(app)
					.post(path)
					.send({ title: 'Test task', priority: 'medium' })
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'deadline');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});

		describe('Invalid Fields', () => {
			it('should fail when invalid fields are provided', async () => {
				const payload = {
					title: 'Test task',
					deadline: '2026-03-23T00:00:00.000Z',
					invalidField: 'invalidValue',
				};
				const response = await supertest(app)
					.post(path)
					.send(payload)
					.set('Authorization', `Bearer ${token}`);
				expect(response.status).toBe(400);
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});

		describe('Empty Fields', () => {
			it('should fail when title is empty', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: '',
						description: 'Test task',
					})
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'title');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});

			it('should fail when deadline is empty', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: 'Test task',
						deadline: '',
					})
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'deadline');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});

		describe('status', () => {
			it('should fail when status is not a valid enum value', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: 'Test task',
						deadline: '2026-03-23T00:00:00.000Z',
						status: 'invalidStatus',
						priority: 'low',
					})
					.set('Authorization', `Bearer ${token}`);

				expectExpressValidatorError(response, 'status');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});

		describe('priority', () => {
			it('should fail when priority is not a valid enum value', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: 'Test task',
						deadline: '2026-03-23T00:00:00.000Z',
						status: 'pending',
						priority: 'invalidPriority',
					})
					.set('Authorization', `Bearer ${token}`);

				expectExpressValidatorError(response, 'priority');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});

		describe('deadline', () => {
			it('should fail when deadline is not a valid date', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: 'Test task',
						deadline: 'not valid date',
					})
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'deadline');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});

			it('should fail when deadline is in the past', async () => {
				const response = await supertest(app)
					.post(path)
					.send({
						title: 'Test task',
						deadline: '1990-03-23T00:00:00.000Z',
						priority: 'medium',
					})
					.set('Authorization', `Bearer ${token}`);
				expectExpressValidatorError(response, 'deadline');
				expect(jwtVerifySpy).not.toHaveBeenCalled();
				expect(taskCreateSpy).not.toHaveBeenCalled();
			});
		});
	});
});
