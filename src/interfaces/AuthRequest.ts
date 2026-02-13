import type { Request } from 'express';
import type { IUser } from './User';
import type { Document } from 'mongoose';

export interface AuthRequest extends Request {
	user?: IUser & Document;
}
