import { prisma } from '../configs/prisma';
import { FaceData as PrismaFaceData } from '../../generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';

//reposity phục vụ việc làm việc với face_data(dữ liệu khuôn mặt)
//prisma chưa hỗ trợ kiểu dữ liệu `Unsupported("vector")` của tiện ích mở rộng `pgvector` trong PostgreSQL
//-> không thể dùng các hàm mặc định mà phải dùng query thuần

//tạo kiểu CustomFaceData với embedding đúng là kiểu vector number
export type CustomFaceData = Omit<PrismaFaceData, 'embedding'> & {
  embedding: number[];
};

//Dữ liệu face data đọc từ csdl là loại string ép trường vector từ DB thành chuỗi `string`
type RawFaceDataResult = Omit<PrismaFaceData, 'embedding'> & {
  embedding: string; 
};

//chuyển đổi dữ liệu đọc từ csdl với embedding là string -> vector number 
const toFaceData = (raw: RawFaceDataResult): CustomFaceData => {
  return {
    id: raw.id,
    subject_id: raw.subject_id,
    created_at: raw.created_at,
    update_at: raw.update_at,
    embedding: JSON.parse(raw.embedding), //chuyển sang mảng
  };
};

export class FaceRepository {

  //kiểm tra có dữ liệu khuôn mặt trong csdl hay không
  public async existsBySubjectId(subject_id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count 
      FROM "face_data" 
      WHERE subject_id = ${subject_id};
    `;
    return result[0].count > 0;
  }

  //tạo mới hoặc ghi đè vector khuôn mặt, đảm bảo subject 1 khuôn mặt
  public async create(subject_id: string, embedding: number[]): Promise<CustomFaceData> {
    const newId = uuidv4();
    const embeddingString = `[${embedding.join(',')}]`;//chuyển sang chuỗi để lưu trữ
    const now = new Date();

    // Thực hiện trong một Transaction
    return await prisma.$transaction(async (tx) => {
      // xóa bản ghi cũ (nếu có) trước khi tạo mới
      await tx.$executeRaw`
        DELETE FROM "face_data" WHERE subject_id = ${subject_id};
      `;

      //thêm dữ liệu mới , ép kiểu embeddingString về đúng dạng vector
      const result = await tx.$queryRaw<RawFaceDataResult[]>`
        INSERT INTO "face_data" (id, subject_id, embedding, created_at, update_at)
        VALUES (${newId}, ${subject_id}, ${embeddingString}::vector, ${now}, ${now})
        RETURNING id, subject_id, created_at, update_at, embedding::text as embedding;
      `;

      //chuyển đổi sang kiểu CustimFaceData trước khi trả về
      return toFaceData(result[0]);
    });
  }

  //Lấy thông tin khuôn mặt của 1 đối tượng
  public async findBySubjectId(subject_id: string): Promise<CustomFaceData | null> {
    const result = await prisma.$queryRaw<RawFaceDataResult[]>`
      SELECT id, subject_id, created_at, update_at, embedding::text as embedding
      FROM "face_data" 
      WHERE subject_id = ${subject_id}
      LIMIT 1;
    `;

    // Nếu mảng rỗng (chưa đăng ký), trả về null
    if (result.length === 0) return null;

    //chuyển đổi sang mảng số
    return toFaceData(result[0]);
  }
}