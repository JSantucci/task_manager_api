import { body } from 'express-validator';

export const validateRegisterUser = [
	body('username')
		.isString()
		.withMessage('Username must be a string.')
		.isLength({ min: 3, max: 30 })
		.withMessage('Username must be 3-30 characters.'),
	body('email').isEmail().withMessage('Email must be valid.'),
	body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];
