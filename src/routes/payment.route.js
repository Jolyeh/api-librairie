import express from "express";
import { createPayment, getAllTransactions, paymentCallback } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const paymentRoutes = express.Router();

paymentRoutes.get('/', authMiddleware, getAllTransactions);
paymentRoutes.get("/callback", paymentCallback);
paymentRoutes.get("/:bookId", authMiddleware, createPayment);

export default paymentRoutes;