import { prisma } from '../config/prisma.js';
import { sendResponse } from '../utils/response.js';
import { hashPassword, verifyPassword } from '../utils/hash_password.js';
import { getToken } from '../utils/token.js';
import { sendEmail } from '../utils/mail.js';

export const register = async (req, res) => {
    try {
        const { name, surname, email, password } = req.body;

        if (!name || !surname || !email || !password) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return sendResponse(res, false, 'Cet email est déjà utilisé.');
        }

        const role = await prisma.role.findUnique({ where: { name: 'BUYER' } });

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                name,
                surname,
                email,
                password: hashedPassword,
                roleId: role.id
            }
        });

        const token = getToken(newUser);

        const data = {
            id: newUser.id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
            roleId: newUser.roleId,
            token: token
        };

        return sendResponse(res, true, 'Inscription réussie.', data);
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de l\'inscription.');
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

        if (!user) {
            return sendResponse(res, false, 'Email ou mot de passe incorrect.');
        }

        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            return sendResponse(res, false, 'Email ou mot de passe incorrect.');
        }

        const token = getToken(user);

        const data = {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            roleId: user.roleId,
            token: token,
            role: user.role,
        };

        return sendResponse(res, true, 'Connexion réussie.', data);

    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la connexion.');
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!oldPassword || !newPassword) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        const isOldPasswordValid = await verifyPassword(oldPassword, user.password);

        if (!isOldPasswordValid) {
            return sendResponse(res, false, 'L\'ancien mot de passe est incorrect.');
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return sendResponse(res, true, 'Mot de passe changé avec succès.');

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors du changement de mot de passe.');
    }
}

export const getOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendResponse(res, false, 'Veuillez fournir un email.');
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return sendResponse(res, false, 'Utilisateur non trouvé.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const isSend = await sendEmail(
            email,
            'Votre code OTP',
            `<p>Votre code OTP est : <strong>${otp}</strong></p>`
        );

        if (!isSend) {
            return sendResponse(res, false, 'Échec de l\'envoi de l\'email.');
        }

        return sendResponse(res, true, 'OTP généré avec succès.', { otp });

    } catch (error) {
        console.error('Erreur lors de la génération de l\'OTP :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la génération de l\'OTP.');
    }
}

export const updatePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return sendResponse(res, false, 'Utilisateur non trouvé.');
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { email },
            data: { password: hashedNewPassword }
        });

        return sendResponse(res, true, 'Mot de passe mis à jour avec succès.');

    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la mise à jour du mot de passe.');
    }
}