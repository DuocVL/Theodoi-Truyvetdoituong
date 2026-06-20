import { prisma } from '../configs/prisma';
import { FaceData as PrismaFaceData } from '../../generated/prisma/client';
import { v4 as uuidv4 } from 'uuid'

// 1. Định nghĩa Type chuẩn mong muốn ở Application Layer (Service/Controller)
export type CustomFaceData = Omit<PrismaFaceData, 'embedding'> & {
  embedding: number[];
};

// 2. Định nghĩa Type thô trả về từ câu lệnh SQL raw query
type RawFaceDataResult = Omit<PrismaFaceData, 'embedding'> & {
  embedding: string; // pgvector trả về chuỗi "[1,2,3...]" khi cast sang text
};

/**
 * Hàm tiện ích chuyển đổi dữ liệu thô từ CSDL sang kiểu dữ liệu ứng dụng nhận diện được
 */
const toFaceData = (raw: RawFaceDataResult): CustomFaceData => {
  return {
    id: raw.id,
    subject_id: raw.subject_id,
    created_at: raw.created_at,
    update_at: raw.update_at,
    embedding: JSON.parse(raw.embedding), // Chuyển chuỗi "[1,2...]" thành number[]
  };
};

export class FaceRepository {
  /**
   * Tạo một bản ghi face_data mới bằng câu lệnh SQL Raw
   */
  public async create(subject_id: string, embedding: number[]): Promise<CustomFaceData> {
    // 2. Chủ động tạo một UUID mới cho bản ghi
    const newId = uuidv4();
    const embeddingString = `[${embedding.join(',')}]`;
    const now = new Date()

    // 3. Đưa biến ${newId} vào danh sách các cột cần INSERT
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      INSERT INTO "face_data" (id, subject_id, embedding,created_at,update_at)
      VALUES (${newId}, ${subject_id}, ${embeddingString}::vector, ${now}, ${now})
      RETURNING id, subject_id, created_at, update_at, embedding::text as embedding;
    `;

    return toFaceData(result[0]);
  }

  /**
   * Lấy toàn bộ bản ghi face_data của một subject
   */
  public async findBySubjectId(subject_id: string): Promise<CustomFaceData[]> {
    const results = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      ORDER BY created_at DESC;
    `;

    return results.map(toFaceData);
  }

  /**
   * Lấy bản ghi face_data mới nhất của một subject
   */
  public async findLatestActiveBySubjectId(subject_id: string): Promise<CustomFaceData | null> {
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (result.length === 0) return null;
    return toFaceData(result[0]);
  }
}