import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import teamsRoutes from './routes/teams.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL],
    credentials: true,
}));

// Rate Limiting to prevent DDoS / Brute Force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic Route for testing
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running Securely' });
});

app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/teams', teamsRoutes);

app.listen(PORT, () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
    console.log(`[Security] Helmet, CORS, RateLimit y CookieParser activos.`);
});
