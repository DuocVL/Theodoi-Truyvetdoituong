import axios from 'axios';
import FormData from 'form-data';

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8000';

class FaceService {
  /**
   * Gọi Python service để lấy embedding đại diện từ nhiều ảnh
   * Sử dụng trong quá trình đăng ký khuôn mặt
   */
  public async registerFace(
    files: Express.Multer.File[]
  ): Promise<number[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    try {
      const response = await axios.post<{
        success: boolean;
        centroid?: number[];
        message?: string;
      }>(`${FACE_SERVICE_URL}/register`, formData, {
        headers: formData.getHeaders(),
      });

      if (response.data.success && response.data.centroid) {
        return response.data.centroid;
      } else {
        const errorMsg = response.data.message || 'Failed to register face in the external service.';
        console.error('[FaceService] Registration failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[FaceService] Error calling face service for registration:', errorMsg);
      throw new Error('Could not communicate with the face recognition service.');
    }
  }

  /**
   * Gọi Python service để xác thực khuôn mặt so với embedding đã lưu
   * Sử dụng trong quá trình check-in
   */
  public async verifyFace(
    files: Express.Multer.File[],
    storedEmbedding: number[]
  ): Promise<{ matched: boolean; avg_distance: number; reason?: string }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    formData.append('stored_embedding', JSON.stringify(storedEmbedding));

    try {
      const response = await axios.post<{
        matched: boolean;
        reason?: string;
        avg_distance?: number;
      }>(`${FACE_SERVICE_URL}/verify`, formData, {
        headers: formData.getHeaders(),
      });
      
      const { matched, avg_distance, reason } = response.data;
      
      return {
        matched: matched,
        avg_distance: avg_distance || -1,
        reason: reason,
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[FaceService] Error calling face service for verification:', errorMsg);
      throw new Error('Could not communicate with the face recognition service.');
    }
  }
}

export default new FaceService();