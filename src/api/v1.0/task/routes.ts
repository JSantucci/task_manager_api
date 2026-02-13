import { Router } from 'express';
import { getAllTasks, getTask, createTask, updateTask, deleteTask, asyncHandler } from './index.ts';
import { validateCreateTask } from '../../../middleware/validators/task/validateCreateTask.ts';
import { validateUpdateTask } from '../../../middleware/validators/task/validateUpdateTask.ts';
import { validateTaskId } from '../../../middleware/validators/task/validateTaskId.ts';
import { authenticateJWT, requireUser } from '../../../middleware/auth.ts';

import { createRateLimiter } from '../../../middleware/rateLimiter.ts';

const taskRouter = Router();
taskRouter.use(authenticateJWT, requireUser);

// Rate limiting for task routes
const taskLimiter = createRateLimiter({ max: 10000 });
taskRouter.use(taskLimiter);
/**
 * @swagger
 * /api/task:
 *   get:
 *     summary: Get all tasks
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Server error
 */
taskRouter.get('/', asyncHandler(getAllTasks));

/**
 * @swagger
 * /api/task/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
taskRouter.get('/:id', validateTaskId, asyncHandler(getTask));

/**
 * @swagger
 * /api/task:
 *   post:
 *     summary: Create a new task
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
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
taskRouter.post('/', validateCreateTask, asyncHandler(createTask));

/**
 * @swagger
 * /api/task/{id}:
 *   put:
 *     summary: Update a task by ID
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
taskRouter.put('/:id', validateTaskId, validateUpdateTask, asyncHandler(updateTask));

/**
 * @swagger
 * /api/task/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Task]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
taskRouter.delete('/:id', validateTaskId, asyncHandler(deleteTask));

export default taskRouter;
