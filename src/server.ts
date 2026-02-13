import app from './app.ts';
import { connectDB } from './config/database.ts';
import { PORT } from './utils/getEnv.ts';

connectDB();

app.listen(PORT, () => {
	console.log(`[server] Server running on port ${PORT} at http://localhost:${PORT}`);
	console.log(`[server] API docs available at http://localhost:${PORT}/api-docs`);
});
