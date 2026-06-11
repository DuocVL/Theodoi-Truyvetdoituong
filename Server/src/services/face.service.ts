
import { PrismaClient } from '@prisma/client';
import { HttpException } from '@/exceptions/http-exception';

// Giả định: bạn có một thư viện để tính toán khoảng cách cosine
// import { cosineSimilarity } from '@/utils/face-math';

export class FaceService {
  private prisma = new PrismaClient();

  /**
   * Giả lập việc xác thực khuôn mặt bằng cách so sánh embedding.
   * @param subjectId ID của subject cần xác thực.
   * @param incomingEmbedding Embedding nhận từ client.
   * @returns boolean cho biết xác thực thành công hay không.
   */
  public async verifySubjectByEmbedding(
    subjectId: string,
    incomingEmbedding: number[],
  ): Promise<boolean> {
    console.log(`Simulating: Verifying face for subject ${subjectId}...`);

    // Lấy embedding đã đăng ký của subject từ CSDL
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { face_embedding: true }, // Giả sử bạn có trường này trong model Subject
    });

    if (!subject || !subject.face_embedding) {
      throw new HttpException(404, 'Subject not found or has no registered face embedding.');
    }

    // Giả lập logic so sánh embedding
    // const registeredEmbedding = subject.face_embedding as number[];
    // const similarity = cosineSimilarity(registeredEmbedding, incomingEmbedding);
    // const SIMILARITY_THRESHOLD = 0.9;

    // Trong bản giả lập, chúng ta sẽ luôn trả về true nếu có embedding
    const isMatch = true; // similarity > SIMILARITY_THRESHOLD;

    console.log(`Simulating: Verification result: ${isMatch}`);
    return isMatch;
  }
}
