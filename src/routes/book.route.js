import express from 'express';
import { addBook, deleteBook, getAllBooks, getBookById, getBooksByCategory, getBooksByUser, searchBooks, updateBook } from '../controllers/book.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/upload.js';
import { handleMulterError } from '../middlewares/handleMulterError.js';



const bookRoutes = express.Router();

bookRoutes.get('/', getAllBooks);
bookRoutes.get('/search', authMiddleware, searchBooks);
bookRoutes.get('/:bookId', authMiddleware, getBookById);
bookRoutes.get('/user/me', authMiddleware, getBooksByUser);
bookRoutes.get('/category/:categoryId', authMiddleware, getBooksByCategory);
bookRoutes.post('/',
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
    ]),
    authMiddleware,
    handleMulterError,
    addBook
);
bookRoutes.put('/:bookId', authMiddleware, updateBook);
bookRoutes.delete('/:bookId', authMiddleware, deleteBook);

export default bookRoutes;