import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import monthsRoutes from './routes/months.js';
import nominationsRoutes from './routes/nominations.js';
import votingRoutes from './routes/voting.js';
import reviewsRoutes from './routes/reviews.js';
import gamesRoutes from './routes/games.js';
import leaderboardRoutes from './routes/leaderboard.js';
import activityRoutes from './routes/activity.js';
import adminRoutes from './routes/admin.js';
import activitiesRoutes from './routes/activities.js';
import councilGamesRoutes from './routes/councilGames.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:5174',
      'http://localhost:5173',
    ];
    // Allow Vercel preview deploys
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, origin);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Demasiadas peticiones' },
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'the-council-secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/months', monthsRoutes);
app.use('/api/nominations', nominationsRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/council-games', councilGamesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  // Ensure CORS headers on error responses too
  const origin = req.headers.origin;
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({ error: err.message });
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`The Council API running on port ${PORT}`);
  });
}
start();
