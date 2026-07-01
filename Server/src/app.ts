import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './configs/env';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import v1Routes from './routes/v1';

const app = express();

//Định nghĩa danh sách các domain được truy cập vào API này 
const allowedOrigins = [env.FRONTEND_URL];
console.log(allowedOrigins)

//Cấu hình CORS quản lý tài nguyên truy cập từ các domain khác
app.use(cors({ 
    origin: (origin, callback) => {
        //Cho phép các requests không có origin (Postman,Mobile), các origin trong danh sách allowedOrigins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, //cho phép gửi kèm cookies, headers Authorization
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],//Các phương thưc
    allowedHeaders: ['Content-Type', 'Authorization']//Các http headers chấp nhận
}));

app.use(helmet());//Thiết lập các HTTP headers an toàn
app.use(express.json());//Middleware giúp express hiểu và phân tích dữ liệu dạng JSON
app.use(express.urlencoded({ extended: true }));//Middleware giúp phân tích được dữ liệu gửi dạng HTTP Form
app.use(loggingMiddleware);//Middleware ghi log

//Cấu hình để client có thể lấy ảnh tĩnh 
const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/v1', v1Routes);

//Middleware xử lý lỗi
app.use(errorMiddleware);

export default app;
