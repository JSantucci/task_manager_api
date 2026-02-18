import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import refresh from '../../../src/api/v1.0/user/refresh';
import User from '../../../src/models/User';
import { HydratedDocument } from 'mongoose';
import { IUser } from '../../../src/interfaces/User';

vi.mock('../../../src/models/User', () => ({
	default: {
		findOne: vi.fn(),
	},
}));

vi.mock('jsonwebtoken', () => ({
	sign: vi.fn().mockReturnValue('mockAccessToken'),
}));

console.error = vi.fn();

describe('Refresh Unit Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return 401 when no cookie provided', async () => {
		const req = {} as Partial<Request>;
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as Partial<Response> as Response;

		await refresh(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: 'Missing refresh token' });
	});

	it('should return 401 for invalid refresh token', async () => {
		vi.mocked(User.findOne).mockResolvedValueOnce(null);
		const req = { cookies: { refreshToken: 'bad' } } as Partial<Request>;
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as Partial<Response> as Response;

		await refresh(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
	});

	it('should rotate token and return new access token', async () => {
		const userMock = {
			findValidRefreshToken: vi.fn().mockReturnValue(true),
			rotateRefreshToken: vi.fn().mockReturnValue({ token: 'newRefresh', tokenHash: 'h' }),
			save: vi.fn().mockResolvedValue(undefined),
			_id: 'userId',
			username: 'user',
		} as unknown as HydratedDocument<IUser>;
		vi.mocked(User.findOne).mockResolvedValueOnce(userMock);

		const req = {
			cookies: { refreshToken: 'validtoken' },
			ip: '127.0.0.1',
			get: vi.fn().mockReturnValue('agent'),
		} as Partial<Request>;

		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			cookie: vi.fn(),
		} as Partial<Response> as Response;

		await refresh(req as Request, res as Response);
		expect(res.json).toHaveBeenCalledWith({ token: 'mockAccessToken' });
		expect(res.cookie).toHaveBeenCalled();
	});

	it('should return 500 on DB error', async () => {
		vi.mocked(User.findOne).mockRejectedValueOnce(new Error('DB error'));
		const req = { cookies: { refreshToken: 'x' } } as Partial<Request>;
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
		} as Partial<Response> as Response;

		await refresh(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
	});
});

export {};
