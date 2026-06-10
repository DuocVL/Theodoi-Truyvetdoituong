
import fs from 'fs/promises';
import path from 'path';
import { ImageRepository } from '../repositories/image.repository';
import { HttpException } from '../exceptions/http-exception';
import { Image , Prisma } from '../../generated/prisma/client';

// Define the allowed upload types, matching middleware
type UploadType = 'avatars' | 'checkins' | 'subjects';

export class ImageService {
  private imageRepository = new ImageRepository();

  /**
   * Handles the upload of a file, creates a corresponding database record.
   * If the database transaction fails, it automatically deletes the uploaded file.
   * @param file - The Express.Multer.File object.
   * @param type - The category of the upload (e.g., 'avatars', 'checkins').
   * @returns The created Image record.
   */
  public async uploadImage(file: Express.Multer.File, type: UploadType): Promise<Image> {
    if (!file) {
      throw new HttpException(400, 'No file provided.');
    }

    const imageData = {
      file_name: file.originalname,
      stored_name: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      url: `/uploads/${type}/${file.filename}`,
      alt_text: file.originalname, // Default alt text
    };

    try {
      const newImage = await this.imageRepository.createImage(imageData);
      return newImage;
    } catch (dbError) {
      // **Rollback logic**: Delete the file if DB operation fails.
      console.error(`Database error during image creation. Deleting orphaned file: ${file.path}`);
      await fs.unlink(file.path).catch(unlinkError => {
        // Log the unlink error, but the primary error is the DB error.
        console.error(`Failed to delete orphaned file ${file.path}:`, unlinkError);
      });
      // Re-throw the original database error to the caller.
      throw dbError;
    }
  }

  /**
   * Deletes an image record from the database and the corresponding file from the filesystem.
   * @param imageId - The ID of the image to delete.
   */
  public async deleteImage(imageId: string): Promise<void> {
    const image = await this.imageRepository.findImageById(imageId);
    if (!image) {
        // If image not in DB, no action needed. Or throw 404 if strictness is required.
        console.warn(`Attempted to delete a non-existent image with ID: ${imageId}`);
        return;
    }

    // Construct the full path to the file
    // Note: image.url is `/uploads/type/filename.ext`
    const filePath = path.join(__dirname, '../../', image.url);

    try {
        // 1. Delete the file from the filesystem
        await fs.unlink(filePath);
        
        // 2. Delete the record from the database
        await this.imageRepository.deleteImage(imageId);

    } catch (error) {
        // If the file doesn't exist, ENOENT error is thrown. We can ignore it and proceed to delete from DB.
        if ( error instanceof Prisma.PrismaClientKnownRequestError && error.code !== 'ENOENT') {
            console.error(`Error during image deletion for ID ${imageId}:`, error);
            throw new HttpException(500, `Failed to delete image. File system or DB error.`);
        }
        // If file was already deleted, we still try to delete the DB record.
        await this.imageRepository.deleteImage(imageId);
    }
  }

  /**
   * Replaces an old image with a new one.
   * @param newFile - The new Express.Multer.File object.
   * @param oldImageId - The ID of the image to be replaced. Can be null or undefined.
   * @param type - The category of the upload.
   * @returns The newly created Image record.
   */
  public async replaceImage(newFile: Express.Multer.File, oldImageId: string | null | undefined, type: UploadType): Promise<Image> {
    // Step 1: Upload the new image. This will handle file saving and DB record creation.
    const newImage = await this.uploadImage(newFile, type);

    // Step 2: If an old image ID was provided, delete the old image.
    if (oldImageId) {
      try {
        await this.deleteImage(oldImageId);
      } catch (error) {
        // Log the error but don't fail the whole operation, as the primary goal (uploading new image) succeeded.
        console.warn(`Could not delete old image (ID: ${oldImageId}) during replacement. It may need manual cleanup.`, error);
      }
    }

    // Step 3: Return the new image record.
    return newImage;
  }
  
  public async getImage(id: string): Promise<Image> {
    const image = await this.imageRepository.findImageById(id)
    if(!image) throw new HttpException(404, "Image not found")
    return image
  }
}
