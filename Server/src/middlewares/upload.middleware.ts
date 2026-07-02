
import multer from 'multer';
import { Request } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { HttpException } from '../exceptions/http-exception';

//Loại thư mục lưu trữ hình ảnh tương ứng mục đích
type UploadType = 'avatars' | 'checkins';

//đường dẫn tuyệt đối đến thư mục lưu trữ hình ảnh 
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

//Kiểm tra thư mục đã tồn tại chưa nếu chưa tạo 
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });//recursive:true giúp tạo nhiều thư mục lồng nhau
}

//Kiểm tra sự tồn tại của các thư mục controng /uploads nếu chưa có tạo
const subdirectories: UploadType[] = ['avatars', 'checkins'];
subdirectories.forEach(subdir => {
  const dirPath = path.join(UPLOAD_DIR, subdir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

//bộ lọc định dạng tệp tin tránh ghi các tệp nhạy cảm 
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];//danh sách các mimetype được phép
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);//chấp nhận file
  } else {
    cb(new HttpException(400, 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));//trả về lỗi
  }
};

//Lưu trữ vật lý file image
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    //Lấy vai trò ảnh từ body/query
    const uploadType = (req.body.uploadType || req.query.uploadType) as UploadType;
    
    //kiểm tra uploadType có hợp lệ không
    if (!uploadType || !subdirectories.includes(uploadType)) {
      return cb(new HttpException(400, 'Invalid or missing uploadType.'), '');
    }

    //kết nối đường dẫn tuyệt đối dẫn thăng tới thư mục phân loại
    const destPath = path.join(UPLOAD_DIR, uploadType);
    cb(null, destPath);
  },
  //tạo tên file ngẫu nhiên tránh trùng 
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');//sinh tên file là chuỗi ngẫu nhiên 32hex
    const extension = path.extname(file.originalname);//lấy phần mở rộng từ file gốc
    cb(null, `${randomName}${extension}`);
  },
});

//tạo multẻ middleware hoàn chỉnh với bộ lọc ,lưu trữ ,giới hạn dung lượng
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, //file tối đa 10 MB
  },
});

export default upload;
