import { prisma } from '../config/prisma.js';
import { sendResponse } from '../utils/response.js';

export const addCategory = async (req, res) => {
    const { name } = req.body;

    const category = await prisma.category.findUnique({
        where: {
            name: name
        }
    });

    if (category) {
        return sendResponse(res, false, "Cette catégorie existe déjà");
    }

    await prisma.category.create({
        data: {
            name
        }
    });

    return sendResponse(res, true, "Catégorie ajoutée");
}

export const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    const category = await prisma.category.findUnique({
        where: {
            id: categoryId
        }
    });

    if (!category) {
        return sendResponse(res, false, "Cette catégorie n'existe pas");
    }

    await prisma.category.update({
        where: {
            id: categoryId
        },
        data: {
            name
        }
    });

    return sendResponse(res, true, "Catégorie modifiée");
}

export const getAllCategory = async (req, res) =>{
    const categories = await prisma.category.findMany({
        include: {
            books: true
        }
    });

    return sendResponse(res, true, "Listes des catégories", categories);
}

export const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;

    const category = await prisma.category.findUnique({
        where: {
            id: categoryId
        }
    });

    if (!category) {
        return sendResponse(res, false, "Cette catégorie n'existe pas");
    }

    await prisma.category.delete({
        where: {
            id: categoryId
        }
    });

    return sendResponse(res, true, "Catégorie supprimée");
}