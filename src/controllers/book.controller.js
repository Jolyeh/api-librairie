import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { sendResponse } from "../utils/response.js";
import path from "path";


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

export const getFavoriteBooks = async (req, res) => {
    const favorites = await prisma.favorite.findMany({
        where: {
            userId: req.user.id,
        },
        include: {
            book: {
                include: {
                    category: true,
                },
            },
        },
    });

    const favoriteBooks = favorites.map(fav => fav.book);

    return sendResponse(res, true, 'Liste des livres favoris', favoriteBooks);
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
  try {
    const { title, description, author, price, categoryId, size, pages, chapitres, type } = req.body;

    // ✅ Vérification des champs obligatoires
    if (!title || !description || !author || !price || !categoryId || !size || !pages || !chapitres || !type) {
      return sendResponse(res, false, "Veuillez remplir tous les champs.");
    }

    // ✅ Vérification des fichiers
    if (!req.files || !req.files.image || !req.files.file) {
      return sendResponse(res, false, "Image et fichier (PDF/EPUB) requis.");
    }

    const imageFile = req.files.image[0];
    const bookFile = req.files.file[0];

    // ✅ Autoriser uniquement PDF et EPUB
    /* const allowedMimeTypes = ["application/pdf", "application/epub+zip"];
    if (!allowedMimeTypes.includes(bookFile.mimetype)) {
      return sendResponse(
        res,
        false,
        "Format non autorisé. Seuls les fichiers PDF et EPUB sont acceptés."
      );
    } */

    // ✅ Donner un nom unique au fichier avant upload
    const uniqueName = `${Date.now()}-${path.parse(bookFile.originalname).name}`;

    // ✅ Upload des fichiers vers Cloudinary
    const imageResult = await uploadToCloudinary(imageFile.buffer, "books/images", "image");
    const fileResult = await uploadToCloudinary(bookFile.buffer, "books/files", "raw", uniqueName);

    if (!imageResult?.secure_url || !fileResult?.secure_url) {
      return sendResponse(res, false, "Erreur lors de l'upload des fichiers.");
    }

    // ✅ Création du livre dans la base
    const newBook = await prisma.book.create({
      data: {
        title,
        description,
        author,
        price: parseFloat(price),
        image: imageResult.secure_url,
        file: fileResult.secure_url,
        type: bookFile.mimetype,
        userId: req.user.id,
        categoryId,
        size,
        type,
        pages,
        chapitres
      },
    });

    return sendResponse(res, true, "Livre ajouté avec succès", newBook);
  } catch (e) {
    console.error("Erreur lors de l'ajout du livre :", e);
    return sendResponse(res, false, "Erreur serveur : " + e.message);
  }
};

export const toggleFavorites = async (req, res) => {
    const { bookId } = req.params;
    
    const book = await prisma.book.findUnique({
        where: { id: bookId }
    });

    if (!book) {
        return sendResponse(res, false, 'Livre non trouvé.');
    }

    const existingFavorite = await prisma.favorite.findFirst({
        where: {
            userId: req.user.id,
            bookId: bookId
        }
    });

    if (existingFavorite) {
        await prisma.favorite.delete({
            where: { id: existingFavorite.id }
        });
        return sendResponse(res, true, 'Livre retiré des favoris.');
    } else {
        await prisma.favorite.create({
            data: {
                userId: req.user.id,
                bookId: bookId
            }
        });
        return sendResponse(res, true, 'Livre ajouté aux favoris.');
    }
    
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

    const updatedBook = await prisma.update({
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