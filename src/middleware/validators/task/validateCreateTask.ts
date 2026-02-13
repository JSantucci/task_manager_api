import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

const handleValidation = (req: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	return next();
};

export const validateCreateTask = [
	body('title')
		.isString()
		.withMessage('Title must be a string.')
		.isLength({ min: 1, max: 100 })
		.withMessage('Title is required and must be 1-100 characters.'),
	body('description').optional().isString().withMessage('Description must be a string.'),
	body('status')
		.optional()
		.isIn(['pending', 'in_progress', 'completed'])
		.withMessage('Invalid status.'),
	body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority.'),
	body('deadline')
		.isISO8601()
		.withMessage('Deadline must be a valid date.')
		.custom((value) => {
			const deadline = new Date(value);
			if (isNaN(deadline.getTime())) throw new Error('Deadline must be a valid date.');
			if (deadline.getTime() <= Date.now())
				throw new Error('Deadline must be in the future.');
			return true;
		})
		.withMessage('Deadline must be a future date.'),
	handleValidation,
];
