import mongoose, { Schema } from 'mongoose';
import type { ITask } from '../interfaces/Task';

const TaskSchema: Schema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	title: { type: String, required: true },
	description: { type: String },
	status: {
		enum: ['pending', 'in progress', 'completed'],
		type: String,
		default: 'pending',
	},
	priority: { enum: ['low', 'medium', 'high'], type: String, required: true },
	deadline: { type: Date, required: true },
});

// Transform _id to id in JSON output
TaskSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function (doc, ret) {
		ret.id = ret._id;
		delete ret._id;
	},
});

export default mongoose.model<ITask>('Task', TaskSchema);
