import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reqAuth, res } from '../../utils/unitTestSetup';
import login from '../../../src/api/v1.0/user/login';
import User from '../../../src/models/User';
import type { IUser } from '../../../src/interfaces/User';
import type { HydratedDocument } from 'mongoose';

vi.mock('../../../src/models/User', () => ({
	default: {
		findOne: vi.fn(),
	},
}));

vi.mock('jsonwebtoken', () => ({
	sign: vi.fn().mockReturnValue('mockToken'),
}));

console.error = vi.fn();

describe('Login User Unit Tests', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
	});

	it('should login a user successfully', async () => {
		type TestUser = {
			comparePassword: (p: string) => Promise<boolean>;
			password?: string;
			username?: string;
			email?: string;
		};
		const mockUser: TestUser = {
			comparePassword: vi.fn().mockResolvedValueOnce(true),
			password: 'hashed-password',
			username: 'test',
			email: 'a@b.com',
		};
		vi.mocked(User.findOne).mockResolvedValueOnce(
			mockUser as unknown as HydratedDocument<IUser>,
		);
		await login(reqAuth as Request, res as Response);
		expect(res.json).toHaveBeenCalledWith({ token: 'mockToken' });
		expect(mockUser.comparePassword).toHaveBeenCalledWith(reqAuth.body.password);
	});

	it('should return 401 for non-existent user', async () => {
		vi.mocked(User.findOne).mockResolvedValueOnce(null);
		await login(reqAuth as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
	});

	it('should return 401 for invalid credentials', async () => {
		const mockUser: {
			comparePassword: (p: string) => Promise<boolean>;
			password?: string;
		} = {
			comparePassword: vi.fn().mockResolvedValueOnce(false),
			password: 'hashed-password',
		};
		vi.mocked(User.findOne).mockResolvedValueOnce(
			mockUser as unknown as HydratedDocument<IUser>,
		);
		await login(reqAuth as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
		expect(mockUser.comparePassword).toHaveBeenCalledWith(reqAuth.body.password);
	});

	it('should return 500 for server error', async () => {
		vi.mocked(User.findOne).mockRejectedValueOnce(new Error('Database error'));
		await login(reqAuth as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
	});
});
