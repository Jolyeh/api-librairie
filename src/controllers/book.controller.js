import { prisma } from "../config/prisma.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { sendResponse } from "../utils/response.js";
import { PDFDocument } from 'pdf-lib';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import ePub from 'epubjs';
import { JSDOM } from 'jsdom';

global.DOMParser = new JSDOM().window.DOMParser;


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

  // Validation des champs
  if (!title || !description || !author || !price || !stock || !categoryId) {
    return sendResponse(res, false, "Veuillez remplir tous les champs.");
  }

  // Vérifier la présence des fichiers
  if (!req.files || !req.files.image || !req.files.file) {
    return sendResponse(res, false, "Image et fichier requis.");
  }

  const imageFile = req.files.image[0];
  const bookFile = req.files.file[0];

  const allowedMimeTypes = ["application/pdf", "application/epub+zip"];

  // Vérifier le type du fichier
  if (!allowedMimeTypes.includes(bookFile.mimetype)) {
    return sendResponse(
      res,
      false,
      "Format de fichier non autorisé. Seuls les fichiers PDF et EPUB sont acceptés."
    );
  }

  try {
    // 1️⃣ Upload des fichiers
    const imageResult = await uploadToCloudinary(imageFile.buffer, "books/images", "image");
    const bookResult = await uploadToCloudinary(bookFile.buffer, "books/files", "raw");

    if (!imageResult?.secure_url || !bookResult?.secure_url) {
      return sendResponse(res, false, "Erreur lors de l'upload des fichiers.");
    }

    // 2️⃣ Extraire info fichier
    let pages = null;
    let chapitres = null;
    const type = bookFile.mimetype;
    const size = `${(bookFile.size / 1024).toFixed(2)} KB`;

    if (type === "application/pdf") {
      const pdfDoc = await PDFDocument.load(bookFile.buffer);
      pages = pdfDoc.getPageCount();
    }

    if (type === "application/epub+zip") {
      try {
        // Écrire temporairement le fichier
        const tmpPath = path.join('/tmp', `${Date.now()}-${bookFile.originalname}`);
        await promisify(fs.writeFile)(tmpPath, bookFile.buffer);

        // Parser avec epubjs
        const book = ePub(tmpPath);
        await book.ready;

        // Récupérer le nombre de chapitres
        const spine = await book.loaded.spine;
        chapitres = spine.items.length;

        // Nettoyer
        await book.destroy();
        fs.unlinkSync(tmpPath);
      } catch (epubError) {
        console.error("Erreur EPUB:", epubError);
        // Continuer même si l'extraction EPUB échoue
        chapitres = null;
      }
    }

    // 3️⃣ Créer le livre dans la base
    const newBook = await prisma.book.create({
      data: {
        title,
        description,
        author,
        price: parseFloat(price),
        stock: parseInt(stock),
        image: imageResult.secure_url,
        file: bookResult.secure_url,
        size,
        type,
        pages: pages !== null ? pages : undefined,
        chapitres: chapitres !== null ? chapitres : undefined,
        userId: req.user.id,
        categoryId,
      },
    });

    return sendResponse(res, true, "Livre ajouté avec succès", newBook);
  } catch (e) {
    console.error("Erreur générale:", e);
    return sendResponse(res, false, "Erreur lors de l'ajout du livre: " + e.message);
  }
};


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