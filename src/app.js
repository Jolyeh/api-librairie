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

// --- Middleware CORS ---
app.use(cors({
  origin: "*", // ou "http://localhost:PORT_FLUTTER_WEB" si tu veux restreindre
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// --- Gestion des pré-requêtes (important pour Flutter Web) ---
app.options('*', cors());

// --- Middlewares essentiels ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de la librairie en ligne');
});

app.use("/images", express.static("upload/images"));
app.use('/api', authRoutes);
app.use('/api/book', bookRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/request', requestRoutes);
app.use("/api/payment", paymentRoutes);
app.use('/api/user', userRoutes);

// --- 404 personnalisé ---
app.all('*', (req, res) => {
  res.status(404).json({ status: false, message: 'Route non trouvée.' });
});

export default app;
