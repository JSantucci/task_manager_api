import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

const DEFAULT_MONGO_BINARY_VERSION = '6.0.5';

export const connectInMemoryDB = async () => {
	try {
		const binaryVersion =
			process.env.MONGO_MEMORY_SERVER_BINARY_VERSION || DEFAULT_MONGO_BINARY_VERSION;
		mongoServer = await MongoMemoryServer.create({
			binary: { version: binaryVersion },
		});
		const uri = mongoServer.getUri();
		// Ensure the application picks up the in-memory URI (some code reads MONGO_URI at import)
		process.env.MONGO_URI = uri;
		await mongoose.connect(uri);
	} catch (error) {
		console.error('Error connecting to in-memory MongoDB:', error);
		throw error;
	}
};

export const disconnectInMemoryDB = async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.connection.dropDatabase();
		await mongoose.disconnect();
	}
	if (mongoServer) {
		await mongoServer.stop();
	}
};
