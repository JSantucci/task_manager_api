import dotenv from 'dotenv';

dotenv.config();

function getEnv(name: string, fallback?: string): string {
	const value = process.env[name] ?? fallback;
	if (!value) {
		throw new Error(`[env] Missing required environment variable: ${name}`);
	}
	return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const PORT = getEnv('PORT', isTest ? '5000' : undefined);
export const MONGO_URI = getEnv('MONGO_URI', isTest ? 'mongodb://127.0.0.1:27017/test' : undefined);
export const JWT_SECRET = getEnv('JWT_SECRET', isTest ? 'testSecret' : undefined);
export const API_VERSION = getEnv('API_VERSION', isTest ? '1.0' : undefined);
