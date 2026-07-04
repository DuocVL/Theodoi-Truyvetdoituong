import { NextFunction, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { RequestWithUser } from '../types/data';
import { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import { getUserByAccountId } from '../repositories/user.repository'
import { HttpException } from '../exceptions/http-exception';
import { logger } from '../utils/log-helper';

//xử lý các yêu cầu liên quan đến điểm danh 
export class CheckinController {
  private checkinService = new CheckinService();

  //lấy lịch sử check-in của chính client 
  public getMyCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role;
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      if(role !== "SUBJECT") throw new HttpException(404, "Not checkin user");
      
      //phân trang đữ liệu 
      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getMyCheckins(accountId, Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  //lấy lịch sử checkin tổng hợp của toàn bộ đối tượng thuộc quyền quản lý của 1 user
  public getUserManagedCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra vai trò
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role || role === "SUBJECT") {
        throw new HttpException(403, 'Forbidden: This route is for users only');
      }

      //lấy userid để từ đó duyệt các subject quản lý
      const user = await getUserByAccountId(req.account?.id as string);
      const createdByUserId = user?.id;
      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Not user' });
        return;
      }

      //lấy checkins của subject thuộc diện quản lý 
      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getUserManagedCheckins(createdByUserId, Number(page), Number(limit), role);
      res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  };

  //tạo checkins
  public createCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra xác thực
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      //kiểm tra có file ảnh không
      const imageFile = req.file;
      if (!imageFile) {
        throw new HttpException(400, 'Image file is missing');
      }

      //xử lý với yêu cầu checkins
      const checkinData: CreateCheckinDto = req.body;
      const newCheckin = await this.checkinService.createCheckin(accountId, checkinData, imageFile);
      res.status(201).json({ data: newCheckin, message: 'Check-in created successfully' });

    } catch (error) {
      next(error);
    }
  };

  //lấy thông tin chi tiết 1 checkin
  public getCheckinById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra vai trò
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) {
        throw new HttpException(403, 'Forbidden: This route is for users only');
      }
      const checkinId = req.params.id as string;//lấy chekcinId
      if(!checkinId) throw new HttpException(400, 'Checkin ID is required.');
      const checkin = await this.checkinService.getCheckinById(checkinId, accountId, role);//lấy thông tin
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  //lấy danh sách checkins của 1 subject
  public getCheckinsBySubject = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //xác thực thông tin
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');
      if(role === "SUBJECT") throw new HttpException(403, 'Forbidden');

      //lấy thông tin user yêu cầu phục vụ việc kiểm tra truy cập dữ liệu
      const user = await getUserByAccountId(accountId);
      const createdByUserId = user?.id;
      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }

      //lấy các thông tin truy vấn
      const subjectId = req.params.subjectId as string;
      if(!subjectId) throw new HttpException(400, 'Subject ID is required.');
      const { page = 1, limit = 10 } = req.query;

      const result = await this.checkinService.getCheckinsBySubject(subjectId, Number(page), Number(limit), user.id, role);
      res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  };

  //TODO update checkin có thể không dùng
  public updateCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //xác thực thông tin
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      //lấy thông tin checkinId
      const checkinId = req.params.id as string;
       if(!checkinId) throw new HttpException(400, 'Checkin ID is required.');
      const notes: string = req.body.notes;

      const updatedCheckin = await this.checkinService.updateCheckinNotes(accountId, checkinId, notes);
      res.status(200).json({ data: updatedCheckin, message: 'Check-in updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  //lấy checkin kèm lọc thời gian
  public getUserManagedCheckinsByTime = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {

      //xác thực quyền
      const accountId = req.account?.id;
      const role = req.role;
      if (!accountId || !role || role === "SUBJECT") throw new HttpException(403, 'Forbidden: This route is for users only');

      //lấy user gửi request
      const user = await getUserByAccountId(accountId);
      if (!user?.id) throw new HttpException(401, 'Unauthorized: User record missing');

      //Lấy thông tin bộ lọc
      const { startDate, endDate, startTime, endTime, page = 1, limit = 10 } = req.query;

      // Kiểm tra các tham số lọc ngày bắt buộc
      if (!startDate || !endDate) {
        throw new HttpException(400, 'Missing required query parameters: startDate and endDate');
      }

      //xử lý giá trị giờ phút giây, nếu không truyền thì mặc định bao quát cả ngày
      const finalStartTime = startTime ? String(startTime) : '00:00:00';
      const finalEndTime = endTime ? String(endTime) : '23:59:59';

      // Truyền thêm dữ liệu thời gian chi tiết xuống tầng Service xử lý nghiệp vụ
      const result = await this.checkinService.getUserManagedCheckinsAndTime(
        user.id,
        role,
        String(startDate),
        String(endDate),
        finalStartTime,
        finalEndTime,
        Number(page),
        Number(limit)
      );
      res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  };


  //xử lý việc lọc checkin của 1 subject cụ thể 
  public getCheckinsBySubjectAndTime = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //xác thực quyền
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role || (role !== "USER" && role !== "ADMIN")) throw new HttpException(401, 'Unauthorized');

      const user = await getUserByAccountId(accountId);
      if (!user?.id) throw new HttpException(401, 'Unauthorized: Manager account not found');

      const subjectId = req.params.subjectId as string;
      if(!subjectId) throw new HttpException(400, 'subjecID required')

      //Lấy thông tin bộ lọc
      const { startDate, endDate, startTime, endTime, page = 1, limit = 10 } = req.query;

      // Kiểm tra các tham số ngày (bắt buộc)
      if (!startDate || !endDate) {
        throw new HttpException(400, 'Missing required query parameters: startDate and endDate');
      }

      //xử lý giá trị giờ phút giây, nếu không truyền thì mặc định bao quát cả ngày
      const finalStartTime = startTime ? String(startTime) : '00:00:00';
      const finalEndTime = endTime ? String(endTime) : '23:59:59';

      //xử lý lọc 
      const result = await this.checkinService.getCheckinsBySubjectAndTime(
        subjectId,
        String(startDate),
        String(endDate),
        finalStartTime,
        finalEndTime,
        Number(page),
        Number(limit),
        user.id,
        role
      );
      res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  };

  //xuất báo cáo điểm danh/lịch trình di chuyển
  public exportReport = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //xác thwucj thông tin 
      const accountId = req.account?.id;
      const role = req.role;
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      //lấy user 
      const user = await getUserByAccountId(accountId);
      const userId = user?.id
      if (!userId) throw new HttpException(401, 'Unauthorized');

      //lấy các tham số cần thiết
      const { startDate, endDate, subjectId } = req.query as any;

      if(!startDate || !endDate || !subjectId) res.status(400).json({message: "Thiếu dữ liệu"});

      //tạo báo cáo
      const buffer = await this.checkinService.exportCheckinReportExcel(userId, role, startDate, endDate, subjectId );

      // Thiết lập Header báo hiệu cho trình duyệt tải file nhị phân
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Bao-Cao-Checkin-${Date.now()}.xlsx`);

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  };
}