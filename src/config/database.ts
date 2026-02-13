import mongoose from 'mongoose';
import { MONGO_URI } from '../utils/getEnv.ts';

if (!MONGO_URI) {
	throw new Error('Missing MongoDB connection environment variables');
}

mongoose.connection.on('connected', () => console.log('[server] Mongoose connected'));
mongoose.connection.on('open', () => console.log('[server] Mongoose open'));
mongoose.connection.on('disconnected', () => console.log('[server] Mongoose disconnected'));
mongoose.connection.on('reconnected', () => console.log('[server] Mongoose reconnected'));
mongoose.connection.on('disconnecting', () => console.log('[server] Mongoose disconnecting'));
mongoose.connection.on('close', () => console.log('[server] Mongoose close'));

export const connectDB = async () => {
	try {
		console.log('MongoDB connecting to', MONGO_URI);
		await mongoose.connect(MONGO_URI);
		console.log('[server] Successfully connected to MongoDB via Mongoose');
	} catch (error) {
		console.error('[server] Error connecting to MongoDB:', error);
		process.exit(1);
	}
};
