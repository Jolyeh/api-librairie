import express from 'express';
import { addBook, deleteBook, toggleFavorites, getFavoriteBooks, getAllBooks, getBookById, getBooksByCategory, getBooksByUser, searchBooks, updateBook, turnInDelete, getAllBooksAdmin } from '../controllers/book.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/upload.js';
import { handleMulterError } from '../middlewares/handleMulterError.js';


const bookRoutes = express.Router();

bookRoutes.get('/user/me', authMiddleware, getBooksByUser);
bookRoutes.get('/favorites', authMiddleware, getFavoriteBooks);
bookRoutes.get('/', getAllBooks);
bookRoutes.get('/adminBook', getAllBooksAdmin);
bookRoutes.get('/search', authMiddleware, searchBooks);
bookRoutes.get('/:bookId', authMiddleware, getBookById);

bookRoutes.get('/category/:categoryId', authMiddleware, getBooksByCategory);
bookRoutes.post('/',
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    authMiddleware,
    handleMulterError,
    addBook
);

bookRoutes.post('/favorites/:bookId', authMiddleware, toggleFavorites);
bookRoutes.put('/:bookId', authMiddleware, updateBook);
bookRoutes.delete('/:bookId', authMiddleware, deleteBook);
bookRoutes.put('/turnInDelete/:bookId', authMiddleware, turnInDelete);

export default bookRoutes;