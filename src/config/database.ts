import mongoose from 'mongoose';
import chalk from 'chalk';
import { MONGO_URI } from '../utils/getEnv.ts';

if (!MONGO_URI) {
	throw new Error('Missing MongoDB connection environment variables');
}

function getDisplayUri(uri: string) {
	try {
		const u = new URL(uri);
		const host = u.hostname + (u.port ? `:${u.port}` : '');
		const db = u.pathname || '';
		return `${host}${db}`;
	} catch {
		// Fallback: redact auth info if present
		return uri.replace(/:\/\/.*@/, '://<REDACTED>@');
	}
}

const displayUri = getDisplayUri(MONGO_URI);

mongoose.connection.on('open', () =>
	console.log(chalk.bold.green('[db]'), 'Mongoose connection open'),
);
mongoose.connection.on('disconnected', () =>
	console.log(chalk.bold.yellow('[db]'), 'Mongoose disconnected'),
);
mongoose.connection.on('reconnected', () =>
	console.log(chalk.bold.green('[db]'), 'Mongoose reconnected'),
);
mongoose.connection.on('disconnecting', () =>
	console.log(chalk.bold.yellow('[db]'), 'Mongoose disconnecting'),
);
mongoose.connection.on('close', () =>
	console.log(chalk.bold.yellow('[db]'), 'Mongoose connection closed'),
);
mongoose.connection.on('error', (err) =>
	console.log(chalk.bold.red('[db]'), 'Mongoose error:', err),
);

export const connectDB = async () => {
	try {
		console.log(
			chalk.bold.yellowBright('[db]'),
			`...Connecting to MongoDB at ${chalk.cyan(displayUri)}`,
		);
		await mongoose.connect(MONGO_URI);
	} catch (error) {
		console.error(chalk.bold.red('[db]'), 'Error connecting to MongoDB:', error);
		process.exit(1);
	}
};
