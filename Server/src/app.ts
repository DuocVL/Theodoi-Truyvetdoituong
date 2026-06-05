import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './configs/env';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

const app = express();

// Middlewares
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// API Routes
app.use('/api/v1', v1Routes);

// Static file serving for uploaded images
// This creates an absolute path to the 'uploads' folder in your project root
app.use('/uploads/auth_images', express.static(path.resolve(process.cwd(), 'uploads/auth_images')));

// Error handling middleware (should be last)
app.use(errorMiddleware);

export default app;
