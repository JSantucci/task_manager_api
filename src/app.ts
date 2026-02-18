import express from 'express';
import cors from 'cors';
import { setupSwagger } from './config/swagger/index.ts';
import apiRouterV1 from './api/v1.0/index.ts';
import { API_VERSION } from './utils/getEnv.ts';

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
		credentials: true,
	}),
);
app.use(express.json());

setupSwagger(app, API_VERSION);

app.use(`/api/v${API_VERSION}`, apiRouterV1);

export default app;
