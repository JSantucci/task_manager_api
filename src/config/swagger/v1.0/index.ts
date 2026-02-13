const definition = {
	openapi: '3.0.0',
	info: {
		title: 'Task Manager API',
		version: '1.0.0',
		description: 'API documentation for the Task Manager project',
	},
	servers: [
		{
			url: 'http://localhost:5000',
		},
	],
	components: {
		schemas: {
			Task: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					title: { type: 'string' },
					description: { type: 'string' },
					status: {
						type: 'string',
						enum: ['pending', 'in progress', 'completed'],
					},
					priority: { type: 'string', enum: ['low', 'medium', 'high'] },
					deadline: { type: 'string', format: 'date-time' },
					userId: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' },
					updatedAt: { type: 'string', format: 'date-time' },
				},
				required: ['_id', 'title', 'status', 'priority', 'deadline', 'userId'],
			},
			TaskInput: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					description: { type: 'string' },
					status: {
						type: 'string',
						enum: ['pending', 'in progress', 'completed'],
					},
					priority: { type: 'string', enum: ['low', 'medium', 'high'] },
					deadline: { type: 'string', format: 'date-time' },
				},
				required: ['title', 'description', 'status', 'priority', 'deadline'],
			},
			UserRegisterInput: {
				type: 'object',
				properties: {
					username: { type: 'string', minLength: 3, maxLength: 30 },
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 6 },
				},
				required: ['username', 'email', 'password'],
			},
			UserLoginInput: {
				type: 'object',
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 6 },
				},
				required: ['email', 'password'],
			},
			AuthResponse: {
				type: 'object',
				properties: {
					token: { type: 'string' },
				},
			},
			ErrorResponse: {
				type: 'object',
				properties: {
					error: { type: 'string' },
					errors: {
						type: 'array',
						items: { type: 'object' },
					},
				},
			},
		},
	},
};
export default definition;
