import express from 'express';
import { addAdmin, deleteUser, getAllUsers } from '../controllers/user.controller.js';

const userRoutes = express.Router();

userRoutes.get('/', getAllUsers);
userRoutes.post('/add-admin', addAdmin);
userRoutes.delete('/delete/:id', deleteUser);

export default userRoutes;