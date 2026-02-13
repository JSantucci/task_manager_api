import '../utils/unitTestSetup';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';

const createTestUserAndToken = async (username: string, email: string, password: string) => {
	const user = await User.create({ username, email, password });
	const userId = user._id.toString();

	const response = await request(app).post('/api/v1.0/login').send({ email, password });
	if (response.status !== 200 || !response.body.token) {
		throw new Error('Login failed in createTestUserAndToken');
	}

	return { userId, token: response.body.token };
};

export default createTestUserAndToken;
