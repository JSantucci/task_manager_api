import express from 'express';
import cookieParser from 'cookie-parser';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { RequestHandler } from 'express';
import supertest from 'supertest';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import login from '../../../src/api/v1.0/user/login';
import refresh from '../../../src/api/v1.0/user/refresh';
import User from '../../../src/models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());

const loginPath = '/v1.0/auth/login';
const refreshPath = '/v1.0/auth/refresh';

app.post(loginPath, login as RequestHandler);
app.post(refreshPath, refresh as RequestHandler);

const mockUser = {
	username: 'refreshuser',
	email: 'refresh@test.com',
	password: 'password123',
};

describe('Refresh Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		await User.create(mockUser);
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});

	it('should return 401 when no cookie provided', async () => {
		const res = await supertest(app).post(refreshPath).send();
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ error: 'Missing refresh token' });
	});

	it('should return 401 for invalid refresh token', async () => {
		const res = await supertest(app)
			.post(refreshPath)
			.set('Cookie', 'refreshToken=invalidtoken')
			.send();
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ error: 'Invalid refresh token' });
	});

	it('should rotate refresh token and return new access token', async () => {
		// login to receive refresh cookie
		const loginRes = await supertest(app).post(loginPath).send({
			email: mockUser.email,
			password: mockUser.password,
		});
		expect(loginRes.status).toBe(200);
		const setCookie = loginRes.headers['set-cookie'];
		expect(setCookie).toBeDefined();

		const res = await supertest(app).post(refreshPath).set('Cookie', setCookie).send();
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('token');
		// ensure a new refresh cookie was set
		expect(res.headers['set-cookie']).toBeDefined();
	});
});

export {};
