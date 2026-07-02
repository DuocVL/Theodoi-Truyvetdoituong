import { Request, Response, NextFunction } from 'express';
import { ImageService } from '../services/image.service';
import { HttpException } from '../exceptions/http-exception';

//xử lý yêu cầu liên quan đến ảnh
export class ImageController {
  private imageService = new ImageService();

  //xử lý tải lên ảnh
  public uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;//file do upload middleware gán vào req
      const uploadType = req.body.uploadType as any; // 'avatars', 'checkins',

      //không có file image được tải nên
      if (!file) {
        return next(new HttpException(400, 'No file uploaded.'));
      }
      //không có type đính kèm trả lỗi
      if (!uploadType) {
        return next(new HttpException(400, 'uploadType is required.'));
      }

      //Tạo bản ghi ảnh mới trong csdl
      const newImage = await this.imageService.uploadImage(file, uploadType);
      
      res.status(201).json({ 
        message: 'Image uploaded successfully', 
        data: newImage 
      });

    } catch (error) {
      next(error);
    }
  }

  //Lấy ảnh theo id
  public getImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imageId = req.params.id as string;
      const image = await this.imageService.getImage(imageId);
      res.status(200).json({ data: image });
    } catch (error) {
      next(error);
    }
  }

  //xóa ảnh
  public deleteImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imageId = req.params.id as string;
      await this.imageService.deleteImage(imageId);
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
