import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { addAdmin, deleteUser, getAllUsers, updateUser } from '../controllers/user.controller.js';

const userRoutes = express.Router();

userRoutes.get('/', getAllUsers);
userRoutes.post('/add-admin', addAdmin);
userRoutes.put('/edit-profile', authMiddleware, updateUser)
userRoutes.delete('/delete/:id', deleteUser);

export default userRoutes;