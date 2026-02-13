import { authenticateJWT } from './../../src/middleware/auth';
import { Response, NextFunction } from 'express';
import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { res, next } from '..//utils/unitTestSetup';
import type { AuthRequest } from '../../src/interfaces/AuthRequest.ts';

const jwtSecret = 'testSecret';
vi.stubEnv('JWT_SECRET', jwtSecret);
vi.stubEnv('AUTH_SKIP_DB', 'true');
const jwtVerifySpy = vi.spyOn(jwt, 'verify');
console.error = vi.fn();

const createMockRequest = (authHeader: string | null): Partial<AuthRequest> => ({
	header: vi.fn().mockReturnValue(authHeader),
});

const runUnauthorizedTest = (authHeader: string | null, error: Error | null) => {
	const req = createMockRequest(authHeader);
	if (error) {
		jwtVerifySpy.mockImplementation(() => {
			throw error;
		});
	}

	authenticateJWT(req as AuthRequest, res as Response, next as NextFunction);

	expect(res.status).toHaveBeenCalledWith(401);
	expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
};

describe('Auth JWT', () => {
	it('should call next() if token is valid', () => {
		const token = jwt.sign({ _id: 'testId' }, jwtSecret, { expiresIn: '24h' });
		const req = createMockRequest(`Bearer ${token}`);
		authenticateJWT(req as AuthRequest, res as Response, next as NextFunction);

		expect(req.header).toHaveBeenCalledWith('Authorization');
		expect(jwtVerifySpy).toHaveBeenCalledWith(token, jwtSecret);
		expect(req?.user).toEqual({
			_id: 'testId',
			iat: expect.any(Number),
			exp: expect.any(Number),
		});
		expect(next).toHaveBeenCalled();
	});

	it('should return 401 if token is missing', () => {
		runUnauthorizedTest(null, null);
	});

	it('should return 401 if token is invalid', () => {
		runUnauthorizedTest('Bearer invalidToken', new jwt.JsonWebTokenError('invalid token'));
	});

	it('should return 401 if token is expired', () => {
		runUnauthorizedTest(
			'Bearer expiredToken',
			new jwt.TokenExpiredError('jwt expired', new Date()),
		);
	});

	it('should return 401 if token has invalid signature', () => {
		runUnauthorizedTest(
			'Bearer invalidSignatureToken',
			new jwt.JsonWebTokenError('invalid signature'),
		);
	});

	it('should return 401 if token is malformed', () => {
		runUnauthorizedTest('Bearer malformedToken', new jwt.JsonWebTokenError('jwt malformed'));
	});
});
