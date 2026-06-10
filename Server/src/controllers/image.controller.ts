
import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { ImageService } from '@/services/image.service';
import { HttpException } from '@/exceptions/http-exception';

export class ImageController {
  private imageService = Container.get(ImageService);

  public uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const uploadType = req.body.uploadType; // 'avatars', 'checkins', 'subjects'

      if (!file) {
        return next(new HttpException(400, 'No file uploaded.'));
      }
      if (!uploadType) {
        return next(new HttpException(400, 'uploadType is required.'));
      }

      const newImage = await this.imageService.uploadImage(file, uploadType);
      
      res.status(201).json({ 
        message: 'Image uploaded successfully', 
        data: newImage 
      });

    } catch (error) {
      next(error);
    }
  }

  public getImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imageId = req.params.id;
      const image = await this.imageService.getImage(imageId);
      res.status(200).json({ data: image });
    } catch (error) {
      next(error);
    }
  }

  public deleteImageById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const imageId = req.params.id;
      await this.imageService.deleteImage(imageId);
      res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
