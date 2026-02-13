import type { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const handleValidation = (req: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	return next();
};

export const validateTaskId = [
	param('id')
		.custom((value) => mongoose.Types.ObjectId.isValid(value))
		.withMessage('Invalid task ID.'),
	handleValidation,
];
