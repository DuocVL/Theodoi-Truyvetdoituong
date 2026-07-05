import { FaceRepository } from '../repositories/face.repository';
import { HttpException } from '../exceptions/http-exception';
import { FaceData } from '../../generated/prisma/client';
import { getSubjectByAccountId, update } from '../repositories/subject.repository';
import { SubjectStatus } from '../../generated/prisma/enums';

//lớp nghiệp vụ xử lý các nghiệp vụ liên quan đến khuôn mặt

export class FaceService {

  private faceRepository = new FaceRepository()

  public async registerFace(accountId: string, embedding: number[]): Promise<FaceData> {
    //kiểm tra dữ liệu face_data
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0 || embedding.some(x => typeof x !== "number")) {
      throw new HttpException(400, 'Invalid or empty embedding vector provided.');
    }

    //xác định subject đăng ký
    const subject = await getSubjectByAccountId(accountId);
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    //chỉ cho đăng ký nếu có trạng thái NO_FACE
    if (subject.status !== SubjectStatus.NO_FACE) throw new HttpException(403, 'Subject không có quyền');

    // Gọi repository để lưu vào CSDL
    const newFaceData = await this.faceRepository.create(subject.id, embedding);
    await update(subject.id, { status: SubjectStatus.ACTIVE });//cập nhật trạng thái subject là đã thiết lập khuôn mặt
    return newFaceData;
  }

  //lấy dữ liệu face của subject
  public async getFaceDataForSubject(accountId: string): Promise<FaceData> {
    //tìm subject yêu cầu
    const subject = await getSubjectByAccountId(accountId);
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    //kiểm tra subject đã đăng ký khuôn mặt chưa
    if (subject.status === SubjectStatus.NO_FACE) throw new HttpException(403, 'Subject chưa đăng ký khuôn mặt');

    // Gọi repository để truy xuất từ CSDL
    const faceData = await this.faceRepository.findBySubjectId(subject.id);
    // Nếu chưa đăng ký khuôn mặt (kết quả là null) -> Báo lỗi ngay lập tức
    if (!faceData) {
      throw new HttpException(404, 'Biometric data not found. This subject has not registered a face yet.');
    }

    return faceData;
  }
}
