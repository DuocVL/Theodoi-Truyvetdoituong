
import fs from 'fs/promises';
import path from 'path';
import { ImageRepository } from '../repositories/image.repository';
import { HttpException } from '../exceptions/http-exception';
import { Image } from '../../generated/prisma/client';
import { logger } from '../utils/log-helper';
import { ImageUpdateInput } from '../../generated/prisma/models';


//danh sách các thư mục với các mục đích khác nhau 
type UploadType = 'avatars' | 'checkins';

//dịch vụ phục vụ xử lý các logic liên quan đến ảnh
export class ImageService {
  private imageRepository = new ImageRepository();

  //xử lý lưu thông tin ảnh vào database sau khi file được Multer ghi vào ổ
  //nếu ghi thất bại xóa luôn file vật lý
  public async uploadImage(file: Express.Multer.File, type: UploadType): Promise<Image> {
    //kiểm tra có file không
    if (!file) {
      throw new HttpException(400, 'No file provided.');
    }

    //tạo dữ liệu image lưu database
    const imageData = {
      file_name: file.originalname,
      stored_name: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      url: `/uploads/${type}/${file.filename}`,
      alt_text: file.originalname,//văn bản thay thế
    };

    try {
      //lưu bản ghi image
      const newImage = await this.imageRepository.createImage(imageData);
      return newImage;
    } catch (dbError) {
      //Xử lý khi lỗi ghi file
      logger.error(`Database error during image creation. Deleting orphaned file: ${file.path}`);
      //xóa file vật lý
      await fs.unlink(file.path).catch(unlinkError => {
        //xóa gặp lỗi
        logger.error(`Failed to delete orphaned file ${file.path}:`, unlinkError);
      });
      //Tạo lỗi
      throw new HttpException(500,"Write file error");
    }
  }

  //xóa image theo imageId
  public async deleteImage(imageId: string): Promise<void> {
    //tìm xem image có tồn tại không
    const image = await this.imageRepository.findImageById(imageId);
    if (!image) {
        logger.error(`Attempted to delete a non-existent image with ID: ${imageId}`);
        return;
    }

    //xác định đường dẫn tuyệt đối đến tệp`vật lý
    const filePath = path.join(__dirname, '../../', image.url);
    try {
        
        await fs.unlink(filePath);//xóa tệp vật lý
        await this.imageRepository.deleteImage(imageId);//xóa bản ghi trong csdl
    } catch (error) {
        await this.imageRepository.deleteImage(imageId);
        throw new HttpException(500,`Failed to delete image. File system or DB error.`);
    }
  }

  //cập nhật image
  public async updateImage(imageId: string, data: ImageUpdateInput): Promise<void> {
    //tìm xem image có tồn tại không
    const image = await this.imageRepository.findImageById(imageId);
    if (!image) {
        logger.error(`Attempted to delete a non-existent image with ID: ${imageId}`);
        return;
    }
    //cập nhật
    try {
      await this.imageRepository.updateImage(imageId, data);
    } catch (error) {
      throw new HttpException(500,`Failed to update image.`);
    }
  }
  
  //truy vấn thông tin tệp ảnh
  public async getImage(id: string): Promise<any> {
    //kiểm tra image có tồn tại không
    const image = await this.imageRepository.findImageById(id);
    
    if(!image) throw new HttpException(404, "Image not found");

    return image;
  }
}
