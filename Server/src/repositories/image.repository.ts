
import { Image, Prisma } from '../../generated/prisma/client';
import { HttpException } from '../exceptions/http-exception';
import { prisma } from '../configs/prisma';


export class ImageRepository {


  public async createImage(fileData: Omit<Image, 'id' | 'created_at' | 'updated_at' | 'checkinImage' | 'subjectAvatar' | 'userAvatar'>): Promise<Image> {
    try {
      const newImage = await prisma.image.create({
        data: fileData,
      });
      return newImage;
    } catch (error) {
      console.error("Error creating image in DB:", error);
      throw new HttpException(500, 'Could not create image in database.');
    }
  }

  public async findImageById(imageId: string): Promise<Image | null> {
    try {
      const image = await prisma.image.findUnique({
        where: { id: imageId },
      });
      return image;
    } catch (error) {
      console.error("Error finding image in DB:", error);
      throw new HttpException(500, 'Database error while finding image.');
    }
  }

  public async deleteImage(imageId: string): Promise<Image> {
    try {
      const deletedImage = await prisma.image.delete({
        where: { id: imageId },
      });
      return deletedImage;
    } catch (error) {
      // Check if it's a known Prisma error for a missing record
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException(404, 'Image not found.');
      }
      // For all other errors
      console.error("Error deleting image from DB:", error);
      throw new HttpException(500, 'Could not delete image from database.');
    }
  }
}
