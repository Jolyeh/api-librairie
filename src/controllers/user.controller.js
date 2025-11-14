import { prisma } from "../config/prisma.js";
import { sendResponse } from "../utils/response.js";
import { hashPassword } from '../utils/hash_password.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                role: {
                    select: {
                        name: true
                    }
                }
            },
        });

        return sendResponse(res, true, 'Utilisateurs récupérés avec succès.', users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la récupération des utilisateurs.');
    }
}

export const addAdmin = async (req, res) => {
    try {
        const { name, surname, email, password } = req.body;

        if (!name || !surname || !email || !password) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return sendResponse(res, false, 'Un utilisateur avec cet email existe déjà.');
        }

        const hashedPassword = await hashPassword(password);

        const role = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

        if (!role) {
            return sendResponse(res, false, 'Rôle administrateur non trouvé.');
        }

        const newUser = await prisma.user.create({
            data: {
                name,
                surname,
                email,
                password: hashedPassword,
                roleId: role.id
            }
        });

        return sendResponse(res, true, 'Administrateur ajouté avec succès.', {
            id: newUser.id,
            name: newUser.name,
            surname: newUser.surname,
            email: newUser.email,
            roleId: newUser.roleId
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'administrateur :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de l\'ajout de l\'administrateur.');
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id: id } });

        if (!user) {
            return sendResponse(res, false, 'Utilisateur non trouvé.');
        }

        await prisma.user.delete({ where: { id: id } });

        return sendResponse(res, true, 'Utilisateur supprimé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la suppression de l\'utilisateur.');
    }
}

export const updateUser = async (req, res) => {
    try {
        const { name, surname, email } = req.body;

        if (!name || !surname || !email) {
            return sendResponse(res, false, 'Veuillez remplir tous les champs.');
        }

        let user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user) {
            return sendResponse(res, false, 'Utilisateur non trouvé.');
        }

        if (email != user.email) {
            const existingEmail = await prisma.user.findUnique({ where: { email } });

            if (existingEmail) {
                return sendResponse(res, false, 'Cet email existe déjà.');
            }
        }


        user = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                name,
                surname,
                email
            }
        });

        return sendResponse(res, true, "Profil mise à jour", user);

    } catch (error) {
        console.error('Erreur :', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la mise à jour du profil.');
    }
}

export const getRole = async (req, res) => {
    try {
        const role = await prisma.role.findFirst({
            where: {
                id: req.user.role.id
            }
        });

        if(!role){
            return sendResponse(res, false, 'Pas de role');
        }

        return sendResponse(res, true, "Role récupéré", role);
    } catch (error) {
        console.error('Erreur lors:', error);
        return sendResponse(res, false, 'Une erreur est survenue lors de la récupération.');
    }

}