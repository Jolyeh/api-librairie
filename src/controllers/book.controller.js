import { prisma } from "../config/prisma.js";
import { sendResponse } from "../utils/response.js";


export const getAllBooks = async (req, res) => {
    const books = await prisma.book.findMany({
        include: {
            category: true,
        },
    });
    return sendResponse(res, true, 'Liste des livres', books);
}

export const getBooksByCategory = async (req, res) => {
    const { categoryId } = req.params;
    const books = await prisma.book.findMany({
        include: {
            category: true,
        },
        where: {
            categoryId: categoryId,
        },
    });
    return sendResponse(res, true, 'Liste des livres par catégorie', books);
}

export const getBookById = async (req, res) => {
    const { bookId } = req.params;
    const book = await prisma.book.findUnique({
        where: {
            id: bookId,
        },
        include: {
            category: true,
        },
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    await prisma.book.update({
        data: {
            click: { increment: 1 }
        },
        where: {
            id: bookId
        }
    });

    return sendResponse(res, true, 'Détails du livre', book);
}

export const getBooksByUser = async (req, res) => {
    const books = await prisma.book.findMany({
        where: {
            userId: req.user.id,
        },
        include: {
            category: true,
        },
    });
    return sendResponse(res, true, 'Liste des livres de l\'utilisateur', books);
}

export const searchBooks = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return sendResponse(res, false, 'Veuillez fournir un terme de recherche.');
    }

    const books = await prisma.book.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { author: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ],
        },
        include: {
            category: true,
        },
    });

    return sendResponse(res, true, `Résultats pour ${query}`, books);
};

export const addBook = async (req, res) => {
    const { title, description, author, price, stock, categoryId } = req.body;

    if (!title || !description || !author || !price || !stock || !categoryId) {
        return sendResponse(res, false, 'Veuillez remplir tous les champs.');
    }

    const image = req.files?.image ? req.files.image[0].filename : null;
    const pdf = req.files?.pdf ? req.files.pdf[0].filename : null;

    if (!image || !pdf) {
        return sendResponse(res, false, "Image et PDF requis.");
    }

    const newBook = await prisma.book.create({
        data: {
            title,
            description,
            author,
            price: parseFloat(price),
            stock: parseInt(stock),
            image,
            pdf,
            userId: req.user.id,
            categoryId
        }
    });

    return sendResponse(res, true, 'Livre ajouté', newBook);
}

export const deleteBook = async (req, res) => {
    const { bookId } = req.params;

    const book = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    if (book.userId !== req.user.id && req.user.role.name !== 'ADMIN') {
        return sendResponse(res, false, "Vous n'êtes pas autorisé à supprimer ce livre.");
    }

    await prisma.book.delete({
        where: { id: bookId }
    });

    return sendResponse(res, true, 'Livre supprimé avec succès.');
}

export const updateBook = async (req, res) => {
    const { bookId } = req.params;
    const { title, description, author, price, stock, categoryId } = req.body;

    if (!title || !description || !author || !price || !stock || !categoryId) {
        return sendResponse(res, false, 'Veuillez remplir tous les champs.');
    }

    const book = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    if (book.userId !== req.user.id) {
        return sendResponse(res, false, "Vous n'êtes pas autorisé à modifier ce livre.");
    }

    const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: {
            title,
            description,
            author,
            price: parseFloat(price),
            stock: parseInt(stock),
            categoryId
        }
    });

    return sendResponse(res, true, 'Livre mis à jour avec succès.', updatedBook);
}

export const downloadBook = async (req, res) => {
    const { bookId } = req.params;

    const book = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    const filePath = `uploads/pdf/${book.pdf}`;
    const downloadName = `${book.title}.pdf`;

    res.download(filePath, downloadName, (err) => {
        if (err) {
            return sendResponse(res, false, 'Erreur lors du téléchargement du livre.');
        }
    });

    await prisma.book.update({
        data: {
            download: { increment: 1 }
        },
        where: {
            id: bookId
        }
    });
}

export const showBookImage = async (req, res) => {
    const { bookId } = req.params;

    const book = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    const imagePath = `uploads/images/${book.image}`;

    res.sendFile(imagePath, { root: '.' }, (err) => {
        if (err) {
            return sendResponse(res, false, "Erreur lors de l'affichage de l'image.");
        }
    });
}