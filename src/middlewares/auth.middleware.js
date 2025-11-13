import { sendResponse } from "../utils/response.js";
import { verifyToken } from "../utils/token.js";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    if (!token) {
        return sendResponse(res, false, 'Token manquant.');
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return sendResponse(res, false, 'Token invalide ou expiré. Veuillez vous reconnectez');
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification du token :', error);
        return sendResponse(res, false, 'Erreur lors de la vérification du token.');
    }
}