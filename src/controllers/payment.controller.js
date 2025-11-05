import { FedaPay, Transaction } from "fedapay";
import { sendResponse } from "../utils/response.js";
import { prisma } from "../config/prisma.js";

export const createPayment = async (req, res) => {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');

    try {
        const { bookId } = req.params;

        const book = await prisma.book.findUnique({
            where: { id: bookId },
        });

        const transaction = await Transaction.create({
            description: "Achat du livre : " + book.title,
            amount: book.price,
            currency: { iso: "XOF" },
            callback_url: "http://localhost:3000/api/payment/callback",
            customer: {
                email: req.user.email,
                firstname: req.user.name,
            },
        });

        const token = await transaction.generateToken();
        const paymentUrl = token.url;
        await prisma.transaction.create({
            data: {
                transactionId: transaction.id,
                status: transaction.status,
                bookId: book.id,
                userId: req.user.id,
            }
        });

        const data = {
            transactionId: transaction.id,
            status: transaction.status,
            paymentUrl: paymentUrl,
        };
        return sendResponse(res, true, "Paiement créé avec succès", data);
    } catch (error) {
        console.error(error);
        return sendResponse(res, false, "Erreur lors de la création du paiement");
    }
};

export const paymentCallback = async (req, res) => {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_ENV || "sandbox");

    const { id } = req.query;

    if (!id) {
        return sendResponse(res, false, "ID de transaction manquant");
    }

    try {
        const transaction = await Transaction.retrieve(id);

        await prisma.transaction.updateMany({
            where: { transactionId: transaction.id },
            data: { status: transaction.status },
        });

        switch (transaction.status) {
            case "approved":
                return sendResponse(res, true, "Paiement validé", transaction);
            case "pending":
                return sendResponse(res, false, "Paiement en attente", transaction);
            case "declined":
                return sendResponse(res, false, "Paiement refusé", transaction);
            case "canceled":
                return sendResponse(res, false, "Paiement annulé", transaction);
            case "expired":
                return sendResponse(res, false, "Paiement expiré", transaction);
            default:
                return sendResponse(res, false, `Statut inconnu: ${transaction.status}`, transaction);
        }

    } catch (error) {
        console.error(error);
        return sendResponse(res, false, "Erreur lors du callback FedaPay");
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            select: {
                id: true,
                transactionId: true,
                status: true,
                createdAt: true,
                book: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        email: true,
                    }
                }
            },
            orderBy: [
                { createdAt: "desc" },
                { updatedAt: "desc" }
            ]

        });

        return sendResponse(res, true, "Transactions récupérées avec succès", transactions);
    } catch (error) {
        console.error(error);
        return sendResponse(res, false, "Erreur lors de la récupération des transactions");
    }
}