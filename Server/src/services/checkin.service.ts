/**
 * @file checkin.service.ts
 */
import { CheckinRepository } from '../repositories/checkin.repository';
import { ImageService } from '../services/image.service';
import { HttpException } from '../exceptions/http-exception';
import * as alertRepository from '../repositories/alert.repository';
import { NotificationService } from '../services/notification.service';
import { isInsideZone } from '../utils/geo.util';
import type { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import type { Checkin, Image } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma';
import ExcelJS from 'exceljs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export class CheckinService {
  private checkinRepository = new CheckinRepository();
  private imageService = new ImageService();
  private notificationService = new NotificationService();

  public async createCheckin(accountId: string, checkinData: CreateCheckinDto, imageFile: Express.Multer.File): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    const image: Image = await this.imageService.uploadImage(imageFile, 'checkins');
    const zones = await prisma.zone.findMany({ where: { subject_id: subject.id, is_active: true } });
    const { latitude, longitude } = checkinData;

    // 1. Check vùng cấm trước — luôn ưu tiên, không quan tâm tới hạn checkin
    const restrictedHit = zones.find(z => z.type === 'RESTRICTED' && isInsideZone(latitude, longitude, z));
    if (restrictedHit) {
      const checkin = await this.checkinRepository.create({
        ...checkinData, subject_id: subject.id, image_id: image.id,
        zone_id: restrictedHit.id, status: 'RESTRICTED_VIOLATION',
      });
      await this.notificationService.notifySubject(subject.id, `Bạn đang ở khu vực hạn chế: ${restrictedHit.zone_name}`);
      await alertRepository.createAlert({
        subject_id: subject.id,
        zone_id: restrictedHit.id,
        checkin_id: checkin.id,
        type: 'RESTRICTED_ENTRY',
        message: `Đối tượng ${subject.full_name} đã checkin tại khu vực hạn chế "${restrictedHit.zone_name}" vào lúc ${new Date().toLocaleString('vi-VN')}.`,
      });
      return checkin;
    }

    // 2. Tính xem checkin này có trễ hạn không, để gán LATE/ON_TIME đúng
    const safeHit = zones.find(z => z.type === 'SAFE' && isInsideZone(latitude, longitude, z));
    const interval = safeHit?.interval_minutes ?? subject.interval_minutes;
    const baseline = subject.last_checkin_at ?? subject.monitoring_start ?? subject.created_at;
    const dueAt = new Date(baseline.getTime() + interval * 60_000);
    const isLate = new Date() > dueAt;

    const checkin = await this.checkinRepository.create({
      ...checkinData, subject_id: subject.id, image_id: image.id,
      zone_id: safeHit?.id, status: isLate ? 'LATE' : 'ON_TIME',
    });

    // 3. Reset lịch theo dõi — checkin trễ vẫn được tính là "đã hoàn thành nghĩa vụ", chỉ đánh dấu LATE để lưu vết
    await prisma.subject.update({
      where: { id: subject.id },
      data: { last_checkin_at: new Date(), last_notified_at: null, current_zone_id: safeHit?.id ?? null },
    });

    return checkin;
  }

  public async getMyCheckins(accountId: string, page: number, limit: number) {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    return this.checkinRepository.findBySubjectIdPaginated(subject.id, page, limit);
  }

  public async getCheckinById(id: string): Promise<Checkin> {
    const checkin = await this.checkinRepository.findById(id);
    if (!checkin) throw new HttpException(404, 'Check-in not found');
    return checkin;
  }

  public async updateCheckinNotes(accountId: string, checkinId: string, updateData: UpdateCheckinDto): Promise<Checkin> {
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    const checkin = await this.checkinRepository.findById(checkinId);
    if (!checkin) throw new HttpException(404, 'Check-in not found');
    if (checkin.subject_id !== subject.id) throw new HttpException(403, 'Forbidden: You do not own this check-in');
    return this.checkinRepository.update(checkinId, updateData);
  }

  public async getCheckinsBySubject(subjectId: string, page: number, limit: number, userId: string, role: string) {
    if (role !== 'ADMIN') {
      const subject = await prisma.subject.findFirst({ where: { id: subjectId, created_by: userId } });
      if (!subject) throw new HttpException(403, 'Forbidden: You do not manage this subject');
    }
    return this.checkinRepository.findBySubjectIdPaginated(subjectId, page, limit);
  }

  public async getUserManagedCheckins(userId: string, page: number, limit: number) {
    const managedSubjects = await prisma.subject.findMany({ where: { created_by: userId }, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const subjectIds = managedSubjects.map((s) => s.id);
    return this.checkinRepository.findBySubjectIdsPaginated(subjectIds, page, limit);
  }

  public async getCheckinsBySubjectAndTime(
    subjectId: string,
    startDateStr: string,
    endDateStr: string,
    startTimeStr: string | undefined,
    endTimeStr: string | undefined,
    page: number,
    limit: number,
    userId: string,
    role: string
  ) {
    if (role !== 'ADMIN') {
      const subject = await prisma.subject.findFirst({ where: { id: subjectId, created_by: userId } });
      if (!subject) throw new HttpException(403, 'Forbidden: You do not manage this subject');
    }

    const start = new Date(startDateStr);
    if (startTimeStr) {
      const [h, m] = startTimeStr.split(':').map(Number);
      start.setHours(h, m, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    const end = new Date(endDateStr);
    if (endTimeStr) {
      const [h, m] = endTimeStr.split(':').map(Number);
      end.setHours(h, m, 59, 999);
    } else {
      end.setHours(23, 59, 59, 999);
    }

    return this.checkinRepository.findBySubjectIdAndTimeRange(subjectId, start, end, page, limit);
  }

  /**
   * MỚI: Xử lý nghiệp vụ lọc thời gian kèm giờ của toàn bộ đối tượng thuộc quyền quản lý của User
   */
  public async getUserManagedCheckinsAndTime(
    userId: string,
    startDateStr: string,
    endDateStr: string,
    startTimeStr: string | undefined,
    endTimeStr: string | undefined,
    page: number,
    limit: number
  ) {
    const managedSubjects = await prisma.subject.findMany({ where: { created_by: userId }, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], allPoints: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    const subjectIds = managedSubjects.map((s) => s.id);

    const start = new Date(startDateStr);
    if (startTimeStr) {
      const [h, m] = startTimeStr.split(':').map(Number);
      start.setHours(h, m, 0, 0);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    const end = new Date(endDateStr);
    if (endTimeStr) {
      const [h, m] = endTimeStr.split(':').map(Number);
      end.setHours(h, m, 59, 999);
    } else {
      end.setHours(23, 59, 59, 999);
    }

    return this.checkinRepository.findBySubjectIdsAndTimeRange(subjectIds, start, end, page, limit);
  }

  public async exportCheckinReportExcel(userId: string, role: string, filters: { startDate?: string; endDate?: string; subjectId?: string }) {
    // 1. Xây dựng điều kiện lọc (Where clause)
    const whereClause: any = {};

    // Nếu không phải ADMIN, chỉ cho phép xuất dữ liệu của các Subject do User đó quản lý
    if (role !== 'ADMIN') {
      const managedSubjects = await prisma.subject.findMany({ where: { created_by: userId }, select: { id: true } });
      const managedIds = managedSubjects.map(s => s.id);

      if (filters.subjectId) {
        if (!managedIds.includes(filters.subjectId)) throw new Error('Forbidden: You do not manage this subject');
        whereClause.subject_id = filters.subjectId;
      } else {
        whereClause.subject_id = { in: managedIds };
      }
    } else if (filters.subjectId) {
      whereClause.subject_id = filters.subjectId;
    }

    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date('1970-01-01');
      if (filters.startDate) start.setHours(0, 0, 0, 0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      if (filters.endDate) end.setHours(23, 59, 59, 999);

      whereClause.checkin_time = { gte: start, lte: end };
    }

    // 2. Lấy dữ liệu từ database cộng thêm quan hệ Subject và Image
    const checkins = await prisma.checkin.findMany({
      where: whereClause,
      include: {
        subject: { select: { full_name: true, code: true } },
        image: true
      },
      orderBy: { checkin_time: 'desc' }
    });

    // 3. Khởi tạo Workbook & Worksheet ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo tuần tra di chuyển');

    // Cấu hình các cột (Chỉ định key và width, KHÔNG để thuộc tính 'header' ở đây để tránh tự chèn vào dòng 1)
    worksheet.columns = [
      { key: 'stt', width: 8 },
      { key: 'code', width: 15 },
      { key: 'fullName', width: 25 },
      { key: 'time', width: 22 },
      { key: 'location', width: 25 },
      { key: 'faceVerified', width: 20 },
      { key: 'notes', width: 25 },
      { key: 'image', width: 20 },
    ];

    // =================================================================
    // PHẦN ĐẦU FILE: THÔNG TIN ĐỐI TƯỢNG & THỜI GIAN LỌC BÁO CÁO
    // =================================================================

    // Lấy chuỗi thông tin Đối tượng
    let subjectInfoStr = 'Tất cả đối tượng thuộc quyền quản lý';
    if (filters.subjectId) {
      const targetSubject = await prisma.subject.findUnique({
        where: { id: filters.subjectId },
        select: { full_name: true, code: true }
      });
      if (targetSubject) {
        subjectInfoStr = `${targetSubject.full_name} (${targetSubject.code || '-'})`;
      }
    }

    // Định dạng chuỗi thông tin Thời gian lọc
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
    };

    let timeRangeStr = 'Toàn bộ thời gian (Từ trước đến nay)';
    if (filters.startDate && filters.endDate) {
      timeRangeStr = `Từ ngày ${formatDate(filters.startDate)} đến ngày ${formatDate(filters.endDate)}`;
    } else if (filters.startDate) {
      timeRangeStr = `Từ ngày ${formatDate(filters.startDate)} đến nay`;
    } else if (filters.endDate) {
      timeRangeStr = `Từ trước đến ngày ${formatDate(filters.endDate)}`;
    }

    // Dòng 2: Tiêu đề báo cáo lớn
    worksheet.mergeCells('A2:H2');
    const titleCell = worksheet.getCell('A2');
    titleCell.value = 'BÁO CÁO LỊCH TRÌNH TUẦN TRA DI CHUYỂN';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 30;

    // Dòng 3: Thông tin đối tượng theo dõi
    worksheet.mergeCells('A3:H3');
    const subjectCell = worksheet.getCell('A3');
    subjectCell.value = `Đối tượng theo dõi: ${subjectInfoStr}`;
    subjectCell.font = { name: 'Arial', size: 11, bold: true };
    subjectCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Dòng 4: Khoảng thời gian xuất dữ liệu
    worksheet.mergeCells('A4:H4');
    const timeCell = worksheet.getCell('A4');
    timeCell.value = `Khoảng thời gian: ${timeRangeStr}`;
    timeCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '4B5563' } }; // Màu xám nhẹ tinh tế
    timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(4).height = 20;

    // Dòng 6: Đặt tiêu đề các cột của bảng dữ liệu (Bỏ trống dòng 5 làm khoảng cách)
    const headerRow = worksheet.getRow(6);
    headerRow.values = [
      'STT',
      'Mã đối tượng',
      'Họ và Tên',
      'Thời gian Check-in',
      'Tọa độ (Lat, Lng)',
      'Xác thực khuôn mặt',
      'Ghi chú',
      'Hình ảnh minh họa'
    ];
    headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } }; // Xanh đậm lịch sự
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // =================================================================
    // 4. ĐỔ DỮ LIỆU VÒNG LẶP VÀ CHÈN ẢNH (Bắt đầu từ dòng số 7)
    // =================================================================
    for (let i = 0; i < checkins.length; i++) {
      const c = checkins[i];
      const rowNumber = i + 7; // Thêm 7 đơn vị vì bảng bắt đầu từ dòng số 7

      const row = worksheet.addRow({
        stt: i + 1,
        code: c.subject?.code || '-',
        fullName: c.subject?.full_name || '-',
        time: new Date(c.checkin_time).toLocaleString('vi-VN'),
        location: `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`,
        faceVerified: c.face_verified ? 'Hợp lệ (Thành công)' : 'Không khớp/Lỗi',
        notes: c.notes || '-',
      });

      // Cấu hình chiều cao dòng cho ô dữ liệu chứa ảnh
      worksheet.getRow(rowNumber).height = 65;
      worksheet.getRow(rowNumber).alignment = { vertical: 'middle', horizontal: 'left' };

      // Xử lý chèn ảnh vào cột H (Cột số 8, index: 7)
      if (c.image && c.image.url) {
        try {
          let imageBuffer: Buffer;
          const isRemote = c.image.url.startsWith('http://') || c.image.url.startsWith('https://');

          if (isRemote) {
            const response = await axios.get(c.image.url, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data, 'binary');
          } else {
            const localPath = path.join(process.cwd(), c.image.url);

            if (fs.existsSync(localPath)) {
              imageBuffer = fs.readFileSync(localPath);
            } else {
              console.warn(`[WARN] File ảnh không tồn tại tại đường dẫn: ${localPath}`);
              worksheet.getCell(`H${rowNumber}`).value = 'Không tìm thấy file ảnh';
              continue;
            }
          }

          const fileExt = c.image.url.split('.').pop()?.toLowerCase() || 'jpeg';
          const imageExtension = ['png', 'gif'].includes(fileExt) ? fileExt : 'jpeg';

          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: imageExtension as any,
          });

          worksheet.addImage(imageId, {
            tl: { col: 7, row: rowNumber - 1 }, // rowNumber - 1 để khớp cấu trúc 0-index hệ thống của ExcelJS
            ext: { width: 80, height: 80 },
            editAs: 'undefined'
          });

        } catch (imgError) {
          console.error(`Không thể chèn ảnh cho checkin ID: ${c.id}`, imgError);
          worksheet.getCell(`H${rowNumber}`).value = 'Lỗi xử lý ảnh';
        }
      } else {
        worksheet.getCell(`H${rowNumber}`).value = 'Không có ảnh';
      }
    }

    // Xuất dữ liệu dưới dạng Buffer chuyển ra ngoài Controller
    return await workbook.xlsx.writeBuffer();
  }
}