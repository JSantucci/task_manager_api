import { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';
import dotenv from 'dotenv';
import type { AuthRequest } from '../../src/interfaces/AuthRequest';
import type { IUser } from '../../src/interfaces/User';
import { HydratedDocument, Types } from 'mongoose';

dotenv.config({ path: '.env.test' });

const taskId = new Types.ObjectId().toHexString();

const reqAuth = {
	body: {
		email: 'test@test.com',
		password: 'password',
	},
} as Partial<Request>;

const reqTask = {
	user: { _id: 'userId' } as unknown as HydratedDocument<IUser>,
	params: { taskId, id: taskId },
} as Partial<AuthRequest>;

const res = {
	status: vi.fn().mockReturnThis(),
	json: vi.fn(),
} as Partial<Response>;

const next = vi.fn() as NextFunction;

export { reqAuth, reqTask, res, next, taskId };
