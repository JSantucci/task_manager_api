import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

const handleValidation = (req: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	return next();
};

// Ensure payload isn't empty and doesn't contain unexpected fields
const allowedFields = ['title', 'description', 'status', 'priority', 'deadline'];
const checkAllowedFields = (req: Request, res: Response, next: NextFunction) => {
	const keys = Object.keys(req.body || {});
	if (keys.length === 0)
		return res.status(400).json({
			errors: [{ path: 'payload', location: 'body', msg: 'Payload cannot be empty' }],
		});
	const invalid = keys.filter((k) => !allowedFields.includes(k));
	if (invalid.length > 0)
		return res.status(400).json({
			errors: invalid.map((k) => ({
				path: k,
				location: 'body',
				msg: 'Invalid field',
			})),
		});
	return next();
};

export const validateUpdateTask = [
	checkAllowedFields,
	body('title')
		.optional()
		.isString()
		.withMessage('Title must be a string.')
		.isLength({ min: 1, max: 100 })
		.withMessage('Title must be 1-100 characters.'),
	body('description').optional().isString().withMessage('Description must be a string.'),
	body('status')
		.optional()
		.isIn(['pending', 'in_progress', 'completed'])
		.withMessage('Invalid status.'),
	body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority.'),
	body('deadline')
		.optional()
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
