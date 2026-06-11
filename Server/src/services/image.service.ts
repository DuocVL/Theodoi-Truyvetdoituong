
import { PrismaClient, Image } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { HttpException } from '@/exceptions/http-exception';

// Giả định: bạn có một utility để xử lý việc lưu file
// import { saveFileToDisk } from '@/utils/file-handler';

export class ImageService {
  private prisma = new PrismaClient();

  /**
   * Giả lập việc lưu file ảnh và tạo bản ghi trong CSDL.
   * @param imageFile Đối tượng file từ middleware upload.
   * @param destinationFolder Thư mục con để lưu ảnh.
   * @returns Bản ghi Image từ CSDL.
   */
  public async uploadAndCreateImageRecord(
    imageFile: UploadedFile,
    destinationFolder: string,
  ): Promise<Image> {
    console.log(`Simulating: Saving file ${imageFile.name} to ${destinationFolder}...`);

    // Giả lập logic lưu file và trả về đường dẫn
    // const filePath = await saveFileToDisk(imageFile, destinationFolder);
    const mockFilePath = `/${destinationFolder}/${Date.now()}-${imageFile.name}`;

    try {
      const newImageRecord = await this.prisma.image.create({
        data: {
          // ID sẽ được tự tạo bởi CSDL
          url: mockFilePath,
          mimetype: imageFile.mimetype,
          size: imageFile.size,
        },
      });
      return newImageRecord;
    } catch (error) {
      // Nếu có lỗi CSDL, bạn cần có logic xóa file đã lưu
      // await deleteFileFromDisk(mockFilePath);
      throw new HttpException(500, 'Failed to create image record in database.');
    }
  }
}
