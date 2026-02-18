import { Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import logout from '../../../src/api/v1.0/user/logout';
import User from '../../../src/models/User';
import type { IUser } from '../../../src/interfaces/User';
import type { HydratedDocument } from 'mongoose';

vi.mock('../../../src/models/User', () => ({
	default: {
		findOne: vi.fn(),
	},
}));

console.error = vi.fn();

describe('Logout Unit Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return ok true when no cookie present', async () => {
		const req = {} as Partial<Request>;
		const res = {
			json: vi.fn(),
			clearCookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
		} as Partial<Response> as Response;

		await logout(req as Request, res as Response);
		expect(res.json).toHaveBeenCalledWith({ ok: true });
		expect(res.clearCookie).toHaveBeenCalled();
	});

	it('should revoke refresh token and clear cookie when cookie present', async () => {
		const userMock = {
			revokeRefreshToken: vi.fn().mockReturnValue(true),
			save: vi.fn().mockResolvedValue(undefined),
		} as unknown as HydratedDocument<IUser>;
		vi.mocked(User.findOne).mockResolvedValueOnce(userMock);

		const req = { cookies: { refreshToken: 'token' } } as Partial<Request>;
		const res = {
			json: vi.fn(),
			clearCookie: vi.fn(),
			status: vi.fn().mockReturnThis(),
		} as Partial<Response> as Response;

		await logout(req as Request, res as Response);
		expect(userMock.revokeRefreshToken).toHaveBeenCalled();
		expect(res.clearCookie).toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith({ ok: true });
	});

	it('should return 500 on DB error', async () => {
		vi.mocked(User.findOne).mockRejectedValueOnce(new Error('DB error'));
		const req = { cookies: { refreshToken: 'x' } } as Partial<Request>;
		const res = {
			status: vi.fn().mockReturnThis(),
			json: vi.fn(),
			clearCookie: vi.fn(),
		} as Partial<Response> as Response;

		await logout(req as Request, res as Response);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
	});
});

export {};
