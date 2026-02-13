import rateLimit from 'express-rate-limit';
import type { Options as RateLimitOptions } from 'express-rate-limit';

export function createRateLimiter(options?: Partial<RateLimitOptions>) {
	return rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 1000, // default limit per windowMs
		message: { error: 'Too many requests, please try again later.' },
		...options,
	});
}
