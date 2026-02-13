import { Document, Types } from 'mongoose';

export interface ITask extends Document {
	title: string;
	description: string;
	status: 'pending' | 'in progress' | 'completed';
	priority: 'low' | 'medium' | 'high';
	deadline: Date;
	user: Types.ObjectId;
}
