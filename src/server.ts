import app from './app.ts';
import { connectDB } from './config/database.ts';
import { PORT, API_VERSION } from './utils/getEnv.ts';
import chalk from 'chalk';

connectDB();

app.listen(PORT, () => {
	console.log(chalk.bold.green('[server]'), `Server running on port ${chalk.blue(PORT)}`);
	console.log(
		chalk.bold.cyan('[links]'),
		`API base URL is ${chalk.underline.cyan(`http://localhost:${PORT}/api/v${API_VERSION}`)} & API docs available at ${chalk.underline.cyan(`http://localhost:${PORT}/api-docs`)}`,
	);
});
