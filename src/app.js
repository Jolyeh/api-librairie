import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import bookRoutes from './routes/book.route.js';
import categoryRoutes from './routes/category.route.js';
import requestRoutes from './routes/request.route.js';
import paymentRoutes from './routes/payment.route.js';
import userRoutes from './routes/user.route.js';


const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API de la librairie en ligne');
});

app.use('/api', authRoutes);
app.use('/api/book', bookRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/request', requestRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/user', userRoutes);

app.all(/.*/, (req, res) => {
    res.send({ status: false, message: 'Route non trouvée.' });
});

export default app;