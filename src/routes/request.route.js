import express from 'express';
import { confirmRequest, deleteRequest, getAllRequest, makeRequest, refuseRequest } from '../controllers/request.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const requestRoutes = express.Router();

requestRoutes.get('/', getAllRequest);
requestRoutes.put('/:requestId/confirm', authMiddleware, confirmRequest);
requestRoutes.put('/:requestId/refuse', authMiddleware, refuseRequest);
requestRoutes.post('/', authMiddleware, makeRequest);
requestRoutes.delete('/:requestId', deleteRequest);

export default requestRoutes;