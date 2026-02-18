import { Router } from 'express';
import { register, login, refresh, logout, asyncHandler } from './index.ts';
import { validateRegisterUser } from '../../../middleware/validators/user/validateRegisterUser.ts';
import { validateLoginUser } from '../../../middleware/validators/user/validateLoginUser.ts';
import { createRateLimiter } from '../../../middleware/rateLimiter.ts';

const userRouter = Router();

const authLimiter = createRateLimiter({ max: 1000 });

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post('/register', authLimiter, validateRegisterUser, asyncHandler(register));

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post('/login', authLimiter, validateLoginUser, asyncHandler(login));

/**
 * Refresh endpoint: rotates refresh token and issues new access token
 */
/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Rotate refresh token and issue a new access token
 *     tags: [User]
 *     description: Accepts a refresh token in a secure `refreshToken` cookie, rotates it, sets a new cookie, and returns a short-lived access token.
 *     responses:
 *       200:
 *         description: New access token issued and refresh cookie rotated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post('/refresh', authLimiter, asyncHandler(refresh));

/**
 * Logout: revoke refresh token and clear cookie
 */
/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout a user
 *     tags: [User]
 *     description: Revokes the refresh token (if present) and clears the `refreshToken` cookie.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post('/logout', authLimiter, asyncHandler(logout));

export default userRouter;
