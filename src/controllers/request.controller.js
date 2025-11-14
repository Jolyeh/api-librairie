import { prisma } from '../config/prisma.js';
import { sendEmail } from '../utils/mail.js';
import { sendResponse } from '../utils/response.js';

export const makeRequest = async (req, res) => {
    const { type, reponse } = req.body;
    if (!type || !reponse) {
        return sendResponse(res, false, "Veuillez remplir tous les champs");
    }

    const status = await prisma.status.findUnique({
        where: {
            name: 'PENDING'
        }
    });

    await prisma.request.create({
        data: {
            type,
            reponse,
            userId: req.user.id,
            statusId: status.id
        }
    });

    return sendResponse(res, true, "Demande envoyée avec succès");
}

export const getAllRequest = async (req, res) => {
    const requests = await prisma.request.findMany({
        select: {
            id: true,
            type: true,
            reponse: true,
            status: true,
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
        ]
    });

    return sendResponse(res, true, "Listes des demandes", requests);
}

export const confirmRequest = async (req, res) => {
    const { requestId } = req.params;

    const request = await prisma.request.findUnique({
        where: {
            id: requestId
        },
        include: {
            user: true
        }
    });

    if (!request) {
        return sendResponse(res, false, "Cette demande n'existe pas");
    }

    const status = await prisma.status.findUnique({
        where: {
            name: 'CONFIRM'
        }
    });

    await prisma.request.update({
        where: {
            id: requestId
        },
        data: {
            statusId: status.id
        }
    })

    const role = await prisma.role.findUnique({
        where: {
            name: 'SELLER'
        }
    });

    await prisma.user.update({
        where: {
            id: request.user.id
        },
        data: {
            roleId: role.id
        }
    });

    const email = await sendEmail(
        request.user.email,
        "Confirmation de votre demande",
        `<h1>Votre demande a été acceptée</h1>
        <p>Bonjour ${request.user.name} ${request.user.surname},</p>
        <p>Nous avons le plaisir de vous informer que votre demande pour devenir vendeur a été acceptée.</p>
        <p>Cordialement,</p>
        <p>L'équipe J-Librairie</p>`
    );

    if (!email) {
        return sendResponse(res, false, "Erreur lors de l'envoi de l'email");
    }

    return sendResponse(res, true, "Demande acceptée");
}

export const refuseRequest = async (req, res) => {
    const { reason } = req.body;
    const { requestId } = req.params;

    if (!reason) {
        return sendResponse(res, false, "Veuillez fournir une raison pour le refus");
    }

    const request = await prisma.request.findUnique({
        where: {
            id: requestId
        },
        include: {
            user: true
        }
    });

    if (!request) {
        return sendResponse(res, false, "Cette demande n'existe pas");
    }

    const status = await prisma.status.findUnique({
        where: {
            name: 'REFUSE'
        }
    });

    await prisma.request.update({
        where: {
            id: requestId
        },
        data: {
            statusId: status.id
        }
    })

    const email = await sendEmail(
        request.user.email,
        "Rejet de votre demande",
        `<h1>Votre demande a été rejetée</h1>
        <p>Bonjour ${request.user.name} ${request.user.surname},</p>
        <p>Nous regrettons de vous informer que votre demande pour devenir vendeur a été rejetée.</p>
        <p>Raison du rejet : ${reason}</p>
        <p>Cordialement,</p>
        <p>L'équipe J-Librairie</p>`
    );

    if (!email) {
        return sendResponse(res, false, "Erreur lors de l'envoi de l'email");
    }

    return sendResponse(res, true, "Demande rejetée");
}

export const deleteRequest = async (req, res) => {
    const { requestId } = req.params;

    const request = await prisma.request.findUnique({
        where: {
            id: requestId
        }
    });

    if (!request) {
        return sendResponse(res, false, "Cette demande n'existe pas");
    }

    await prisma.request.delete({
        where: {
            id: requestId
        }
    });

    return sendResponse(res, true, "Demande supprimée");
}