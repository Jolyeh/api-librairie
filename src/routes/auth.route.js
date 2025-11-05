import express from 'express';
import { register, login, changePassword, getOtp, updatePassword } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const authRoutes = express.Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.put('/change-password', authMiddleware, changePassword);
authRoutes.post('/send-otp', getOtp);
authRoutes.put('/reset-password', updatePassword);

export default authRoutes;