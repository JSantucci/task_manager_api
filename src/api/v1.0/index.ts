import express from 'express';
import userRouter from './user/routes.ts';
import taskRouter from './task/routes.ts';

const apiRouterV1 = express.Router();
apiRouterV1.get('/', (req, res) => {
	res.send('API is running');
});
apiRouterV1.use('/', userRouter);
apiRouterV1.use('/task', taskRouter);

export default apiRouterV1;
