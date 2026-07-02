
import { Image, Prisma } from '../../generated/prisma/client';
import { HttpException } from '../exceptions/http-exception';
import { prisma } from '../configs/prisma';
import { logger } from '../utils/log-helper'
//Quản lý các thao tác với bảng Image trong csdl
export class ImageRepository {


  //tạo bản ghi image trong csdl để truy xuất
  public async createImage(fileData: any): Promise<Image> {
    try {
      const newImage = await prisma.image.create({
        data: fileData,
      });
      return newImage;
    } catch (error) {
      logger.error("Error creating image in DB:", error);
      throw new HttpException(500, 'Could not create image in database.');
    }
  }

  //tìm kiếm image theo id 
  public async findImageById(imageId: string): Promise<Image | null> {
    try {
      const image = await prisma.image.findUnique({
        where: { id: imageId },
      });
      return image;
    } catch (error) {
      logger.error("Error finding image in DB:", error);
      throw new HttpException(500, 'Database error while finding image.');
    }
  }

  //xóa bản ghi image
  public async deleteImage(imageId: string): Promise<Image> {
    try {
      const deletedImage = await prisma.image.delete({
        where: { id: imageId },
      });
      return deletedImage;
    } catch (error) {
      logger.error("Error deleting image from DB:", error);
      throw new HttpException(500, 'Could not delete image from database.');
    }
  }
}
