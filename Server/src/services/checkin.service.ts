import { CheckinRepository } from '../repositories/checkin.repository';
import { ImageService } from '../services/image.service';
import { HttpException } from '../exceptions/http-exception';
import * as alertRepository from '../repositories/alert.repository';
import { NotificationService } from '../services/notification.service';
import { isInsideZone } from '../utils/geo.util';
import type { CreateCheckinDto } from '../dtos/checkin.dto';
import type { Checkin, Image } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma';
import ExcelJS from 'exceljs';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { findById, getSubjectByAccountId } from '../repositories/subject.repository';
import { getUserByAccountId } from '../repositories/user.repository';
import { logger } from '../utils/log-helper';

//xử lý các nghiệp vụ liên quan đến checkin

export class CheckinService {

  private checkinRepository = new CheckinRepository();
  private imageService = new ImageService();
  private notificationService = new NotificationService();//xử lý nghiệp vụ tạo cảnh báo(khi đi vào vùng cấm)

  //tạo checkin , kiểm tra các ràng buộc vùng , có checkin trễ không , vi phạm vùng không
  public async createCheckin(accountId: string, checkinData: CreateCheckinDto, imageFile: Express.Multer.File): Promise<Checkin> {
    // xác thực xem accountId gửi lên có thực sự liên kết với hồ sơ đối tượng 
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: Subject not found');

    const image: Image = await this.imageService.uploadImage(imageFile, 'checkins');//lưu bản ghi image checkin
    const zones = await prisma.zone.findMany({ where: { subject_id: subject.id, is_active: true } });//tìm kiếm tất cả các vùng liên quan đến subject này
    const { latitude, longitude } = checkinData;

    //Check vùng cấm trước duyệt từng zone cấm tính toán tọa độ xem có trong giới hạn không
    const restrictedHit = zones.find(z => z.type === 'RESTRICTED' && isInsideZone(latitude, longitude, z));
    if (restrictedHit) {//xử lý khi đã vi phạm vùng cấm
      //lưu trữ bản ghi checkin với trạng thái là vi phạm vùng cấm
      const checkin = await this.checkinRepository.create({
        ...checkinData, subject_id: subject.id, image_id: image.id,
        zone_id: restrictedHit.id, status: 'RESTRICTED_VIOLATION',
      });
      //gửi cảnh báo đến subject là đã phạm vùng cấm
      await this.notificationService.notifySubject(subject.id, `Bạn đang ở khu vực hạn chế: ${restrictedHit.zone_name}`);

      //tạo cảnh báo lưu csdl để cán bộ xem
      await alertRepository.createAlert({
        subject_id: subject.id,
        zone_id: restrictedHit.id,
        checkin_id: checkin.id,
        type: 'RESTRICTED_ENTRY',
        message: `Đối tượng ${subject.full_name} đã checkin tại khu vực hạn chế "${restrictedHit.zone_name}" vào lúc ${new Date().toLocaleString('vi-VN')}.`,
      });
      return checkin;
    }

    //Tính xem checkin này có trễ hạn không, để gán LATE/ON_TIME đúng
    const safeHit = zones.find(z => z.type === 'SAFE' && isInsideZone(latitude, longitude, z));//kiểm tra đối tượng có đang checkin trong vùng an toàn không
    const interval = safeHit?.interval_minutes ?? subject.interval_minutes;//lấy chu kì điểm danh ưu tiên theo zone -> subject
    const baseline = subject.last_checkin_at ?? subject.monitoring_start ?? subject.created_at;//xác định mốc thười gian gốc checkin cuối->mốc bắt đầu giám sát ->ngày tạo hồ sơ 
    const dueAt = new Date(baseline.getTime() + interval * 60_000);//thời gian tối đa phải check-in = mốc gốc + chu kỳ ms
    const isLate = new Date() > dueAt;//nếu thời gian hiện tại quá hạn -> LATE

    //luwu banr ghi checkin
    const checkin = await this.checkinRepository.create({
      ...checkinData, subject_id: subject.id, image_id: image.id,
      zone_id: safeHit?.id, status: isLate ? 'LATE' : 'ON_TIME',
    });

    //reset lịch theo dõi checkin trễ vẫn được tính là đã hoàn thành, chỉ đánh dấu LATE để lưu vết
    await prisma.subject.update({
      where: { id: subject.id },
      data: { last_checkin_at: new Date(), last_notified_at: null, current_zone_id: safeHit?.id ?? null },
    });

    return checkin;
  }

  //lấy các lần checkin của chính mình dành cho subject
  public async getMyCheckins(accountId: string, page: number, limit: number) {
    //kiểm tra có phải subject không
    const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
    return this.checkinRepository.findBySubjectIdPaginated(subject.id, page, limit);
  }

  //lấy chi tiết 1 bản ghi chekcin theo id
  public async getCheckinById(id: string, accountId: string, role: string): Promise<Checkin> {
    //xác thực
    const checkin = await this.checkinRepository.findById(id);
    if (!checkin) throw new HttpException(404, 'Check-in not found');
    if(role === "SUBJECT"){//nếu là subject thì kiểm tra checkin này có thuộc về subject này ko
      const subject = await getSubjectByAccountId(accountId);
      if(!subject) throw new HttpException(403, 'Forbidden: User is not a subject');
      
      if(checkin.subject_id !== subject.id) throw new HttpException(403, 'Forbidden');
    }else if( role === "USER"){//nếu là user kiểm tra user có quản lý không
      const user = await getUserByAccountId(accountId);
      const subject = await findById(checkin.subject_id);
      if(!user || !subject) throw new HttpException(403, 'Forbidden');

      if(subject.created_by !== user.id) throw new HttpException(403, 'Forbidden');
    }
    return checkin;
  }

  //cập nhật thông tin checkin cập nhật note(chưa dùng)
  public async updateCheckinNotes(accountId: string, checkinId: string, notes: string): Promise<Checkin> {
    //kiểm tra subject có tồn tại không
    const subject = await getSubjectByAccountId(accountId);
    if (!subject) throw new HttpException(403, 'Forbidden: User is not a subject');

    //kiểm tra bản ghi checkinId
    const checkin = await this.checkinRepository.findById(checkinId);
    if (!checkin) throw new HttpException(404, 'Check-in not found');

    if (checkin.subject_id !== subject.id) throw new HttpException(403, 'Forbidden: You do not own this check-in');
    return this.checkinRepository.update(checkinId, notes);
  }

  //lấy danh sách checkin theo subjectID
  public async getCheckinsBySubject(subjectId: string, page: number, limit: number, userId: string, role: string) {
    if (role !== 'ADMIN') {//kiểm tra quyền nếu người yêu cầu ko phải admin
      //lấy subject và kiểm tra quyền quản lý
      const subject = await findById(subjectId)
      if (!subject) throw new HttpException(403, 'Forbidden: You do not manage this subject');
      if(subject.created_by !== userId) throw new HttpException(403, 'Forbidden');
    }
    return this.checkinRepository.findBySubjectIdPaginated(subjectId, page, limit);
  }

  //lấy danh sách chekins của người mình đang quản lý
  public async getUserManagedCheckins(userId: string, page: number, limit: number, role: string) {

    //tạo bộ lọc nếu admin có quyền lấy tất
    let whereClause: any = {}
    if(role === "USER") whereClause.created_by = userId

    //lấy danh sách các subject thuộc diện quản lý
    const managedSubjects = await prisma.subject.findMany({ where: whereClause, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    //lấy danh sách subjectId để lấy 
    const subjectIds = managedSubjects.map((s) => s.id);
    return this.checkinRepository.findBySubjectIdsPaginated(subjectIds, page, limit);
  }

  //lấy danh sách checkins của 1 người có bộ lọc thời gian
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
    if (role !== 'ADMIN') {//nếu là cán bộ thì kiểm tra quyền quản lý
      const subject = await findById(subjectId);
      if (!subject || subject.created_by === userId) throw new HttpException(403, 'Forbidden: You do not manage this subject');
    }
    
    //chuẩn hóa thời gian
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


  //lấy danh sách checkin của các subject được quản lý bởi user
  public async getUserManagedCheckinsAndTime(
    userId: string,
    role: string,
    startDateStr: string,
    endDateStr: string,
    startTimeStr: string | undefined,
    endTimeStr: string | undefined,
    page: number,
    limit: number
  ) {
    //lấy danh sách subject
    let whereClause : any = {}
    if(role !== "ADMIN") whereClause.created_by = userId;
    const managedSubjects = await prisma.subject.findMany({ where: whereClause, select: { id: true } });
    if (!managedSubjects || managedSubjects.length === 0) {
      return { data: [], allPoints: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
    //tạo danh sách subjectId
    const subjectIds = managedSubjects.map((s) => s.id);

    //chuẩn hóa thời gian
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

  //hàm xử lý việc tạo báo cáo
  public async exportCheckinReportExcel(userId: string, role: string, startDate: string, endDate: string, subjectId: string ) {

    //xây dựng điều kiện lọc
    const whereClause: any = {};
    whereClause.subject_id = subjectId//lọc các checkin cho subjectid tạo ra

    //láy thông tin của subject 
    const subject = await findById(subjectId);
    if(!subject) throw new HttpException(404,"subject not found");

    // Nếu không phải ADMIN, chỉ cho phép xuất dữ liệu của các Subject do User đó quản lý
    if (role === 'USER' && subject.created_by !== userId) throw new HttpException(404,"Unauthorized");

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999);
    whereClause.checkin_time = { gte: start, lte: end };
    

    //Lây danh sách các checkin và image
    const checkins = await prisma.checkin.findMany({
      where: whereClause,
      include: {
        subject: { select: { full_name: true, id: true } },
        image: true
      },
      orderBy: { checkin_time: 'desc' }
    });

    //Khởi tạo Workbook & Worksheet ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo tuần tra di chuyển');

    // Cấu hình các cột (Chỉ định key và width)
    worksheet.columns = [
      { key: 'stt', width: 8 },
      { key: 'id', width: 15 },
      { key: 'fullName', width: 25 },
      { key: 'time', width: 22 },
      { key: 'location', width: 25 },
      { key: 'faceVerified', width: 20 },
      { key: 'notes', width: 25 },
      { key: 'status', width: 25},
      { key: 'image', width: 20 },
    ];


    //Đầu file: thông tin đối tượng và thời gian lọc
    // Lấy chuỗi thông tin Đối tượng
    let subjectInfoStr = `${subject.full_name} (${subject.id || '-'})`;
    
    
    // Định dạng chuỗi thông tin Thời gian lọc
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
    };
    let timeRangeStr = `Từ ngày ${formatDate(startDate)} đến ngày ${formatDate(endDate)}`;

    //Tiêu đề báo cáo lớn
    worksheet.mergeCells('A2:H2');
    const titleCell = worksheet.getCell('A2');
    titleCell.value = 'BÁO CÁO LỊCH TRÌNH TUẦN TRA DI CHUYỂN';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 30;

    //Thông tin đối tượng theo dõi
    worksheet.mergeCells('A3:H3');
    const subjectCell = worksheet.getCell('A3');
    subjectCell.value = `Đối tượng theo dõi: ${subjectInfoStr}`;
    subjectCell.font = { name: 'Arial', size: 11, bold: true };
    subjectCell.alignment = { horizontal: 'center', vertical: 'middle' };

    //Khoảng thời gian xuất dữ liệu
    worksheet.mergeCells('A4:H4');
    const timeCell = worksheet.getCell('A4');
    timeCell.value = `Khoảng thời gian: ${timeRangeStr}`;
    timeCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '4B5563' } }; // Màu xám nhẹ tinh tế
    timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(4).height = 20;

    //Đặt tiêu đề các cột của bảng dữ liệu 
    const headerRow = worksheet.getRow(6);
    headerRow.values = [
      'STT',
      'CheckinId',
      'Họ và Tên',
      'Thời gian Check-in',
      'Tọa độ (Lat, Lng)',
      'Xác thực khuôn mặt',
      'Ghi chú',
      'Trạng thái',
      'Hình ảnh minh họa'
    ];
    headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    //Chèn dữ liệu và chèn ảnh
    for (let i = 0; i < checkins.length; i++) {
      const c = checkins[i];
      const rowNumber = i + 7; // Thêm 7 đơn vị vì bảng bắt đầu từ dòng số 7

      //khưởi tạo dữ liệu trong dòng mới
      worksheet.addRow({
        stt: i + 1,
        id: c.id || '-',
        fullName: c.subject?.full_name || '-',
        time: new Date(c.checkin_time).toLocaleString('vi-VN'),
        location: `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`,
        faceVerified: c.face_verified ? 'Hợp lệ (Thành công)' : 'Không khớp/Lỗi',
        notes: c.notes || '-',
        status: c.status,
        image: ''
      });

      // Cấu hình chiều cao dòng cho ô dữ liệu chứa ảnh
      worksheet.getRow(rowNumber).height = 65;
      worksheet.getRow(rowNumber).alignment = { vertical: 'middle', horizontal: 'left' };

      // Xử lý chèn ảnh vào cột H (Cột số 8, index: 7)
      if (c.image && c.image.url) {
        try {

          //lấy file ảnh
          const filePath = path.join(__dirname, '../../', c.image.url);
          const imageBuffer = fs.readFileSync(filePath);

          //lấy extension để truyền khi add ảnh
          const ext = c.image.url.split('.').pop()?.toLowerCase();
          const extension =
            ext === 'png' ? 'png'
            : ext === 'gif' ? 'gif'
            : 'jpeg';

          //chèn ảnh vào file excel
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: extension as 'png' | 'jpeg' | 'gif',
          });

          //chèn ảnh vào ô
          worksheet.addImage(imageId, {
            tl: { col: 8, row: rowNumber - 1 }, // rowNumber - 1 để khớp cấu trúc 0-index hệ thống của ExcelJS
            ext: { width: 80, height: 80 },
            editAs: 'undefined'
          });

        } catch (imgError) {
          logger.error(`Không thể chèn ảnh cho checkin ID: ${c.id}`, imgError);
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