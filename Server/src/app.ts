import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './configs/env';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

const app = express();

const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean); // Loại bỏ các giá trị null/undefined

app.use(cors({ 
    origin: (origin, callback) => {
        // 1. Cho phép requests không có origin (như mobile, curl)
        // 2. Kiểm tra origin có nằm trong danh sách cho phép không
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Nên chỉ định rõ các method
    allowedHeaders: ['Content-Type', 'Authorization'] // Nên chỉ định rõ các header
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Static file serving for uploaded images
const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/v1', v1Routes);

// Error handling middleware (should be last)
app.use(errorMiddleware);

export default app;
