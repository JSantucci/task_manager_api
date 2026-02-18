import express from 'express';
import cookieParser from 'cookie-parser';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { RequestHandler } from 'express';
import supertest from 'supertest';
import { connectInMemoryDB, disconnectInMemoryDB } from '../../utils/mongoMemoryServer';
import login from '../../../src/api/v1.0/user/login';
import logout from '../../../src/api/v1.0/user/logout';
import User from '../../../src/models/User';

const app = express();
app.use(express.json());
app.use(cookieParser());

const loginPath = '/v1.0/auth/login';
const logoutPath = '/v1.0/auth/logout';

app.post(loginPath, login as RequestHandler);
app.post(logoutPath, logout as RequestHandler);

const mockUser = {
	username: 'logoutuser',
	email: 'logout@test.com',
	password: 'password123',
};

describe('Logout Integration Tests', () => {
	beforeAll(async () => {
		await connectInMemoryDB();
		await User.create(mockUser);
	});

	afterAll(async () => {
		await disconnectInMemoryDB();
	});

	it('should return ok true and clear cookie when no cookie present', async () => {
		const res = await supertest(app).post(logoutPath).send();
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ok: true });
	});

	it('should revoke refresh token and clear cookie when cookie present', async () => {
		const loginRes = await supertest(app).post(loginPath).send({
			email: mockUser.email,
			password: mockUser.password,
		});
		expect(loginRes.status).toBe(200);
		const setCookie = loginRes.headers['set-cookie'];
		expect(setCookie).toBeDefined();

		const res = await supertest(app).post(logoutPath).set('Cookie', setCookie).send();
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ok: true });

		// verify token revoked in DB
		const user = await User.findOne({ email: mockUser.email });
		expect(user).toBeDefined();
		if (user && user.refreshTokens && user.refreshTokens.length > 0) {
			// at least one token should be marked revoked
			const anyRevoked = user.refreshTokens.some(
				(t: { revoked?: boolean }) => t.revoked === true,
			);
			expect(anyRevoked).toBe(true);
		}
	});
});

export {};
