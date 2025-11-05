import express from 'express';
import { addCategory, deleteCategory, getAllCategory, updateCategory } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const categoryRoutes = express.Router();

categoryRoutes.get('/', authMiddleware, getAllCategory);
categoryRoutes.post('/', authMiddleware, addCategory);
categoryRoutes.put('/:categoryId', authMiddleware, updateCategory);
categoryRoutes.delete('/:categoryId', authMiddleware, deleteCategory);

export default categoryRoutes;