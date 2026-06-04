import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Routes
import path from 'path';

app.use('/api/v1', v1Routes);
// Serve uploaded authentication photos
app.use('/uploads/auth_images', express.static(path.resolve(__dirname, '../../uploads/auth_images')));

// Error handling
app.use(errorMiddleware);

export default app;
