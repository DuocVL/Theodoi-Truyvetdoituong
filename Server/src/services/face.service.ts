
import axios from 'axios';
import FormData from 'form-data';

// This should be in your .env file
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8000';

class FaceService {
  /**
   * Calls the Python service to get a representative embedding from multiple images.
   * @param files An array of image files from multer.
   * @returns The centroid embedding vector.
   * @throws Will throw an error if the registration fails.
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
        console.error('[FaceService] Registration failed:', response.data.message);
        throw new Error(response.data.message || 'Failed to register face in the external service.');
      }
    } catch (error) {
      console.error('[FaceService] Error calling face service for registration:', error.message);
      throw new Error('Could not communicate with the face recognition service.');
    }
  }

  /**
   * Calls the Python service to verify a face against a stored embedding.
   * @param files An array of image files from the check-in attempt.
   * @param storedEmbedding The embedding stored in the database.
   * @returns An object indicating if the face matched and other details.
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
      console.error('[FaceService] Error calling face service for verification:', error.message);
      throw new Error('Could not communicate with the face recognition service.');
    }
  }
}

export default FaceService;
