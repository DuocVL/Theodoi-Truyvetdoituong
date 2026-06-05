import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// API Routes
app.use('/api/v1', v1Routes);

// Static file serving for uploaded images
// This creates an absolute path to the 'uploads' folder in your project root
app.use('/uploads/auth_images', express.static(path.resolve(__dirname, '../../uploads/auth_images')));

// Error handling middleware (should be last)
app.use(errorMiddleware);

export default app;
