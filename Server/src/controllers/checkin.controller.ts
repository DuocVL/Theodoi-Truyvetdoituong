/**
 * @file checkin.controller.ts
 * @description Controller xử lý các request HTTP cho module Checkin.
 */

import { NextFunction, Response } from 'express';
import { CheckinService } from '../services/checkin.service';
import { RequestWithUser } from '../types/data';
import { CreateCheckinDto, UpdateCheckinDto } from '../dtos/checkin.dto';
import { getUserByAccountId } from '../repositories/user.repository'
import { HttpException } from '../exceptions/http-exception';

export class CheckinController {
  private checkinService = new CheckinService();

  public getMyCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getMyCheckins(accountId, Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getUserManagedCheckins = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();

      if (!accountId || role !== 'USER') {
        throw new HttpException(403, 'Forbidden: This route is for users only');
      }

      const user = await getUserByAccountId(req.account?.id as string);
      const createdByUserId = user?.id;
      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }

      const { page = 1, limit = 10 } = req.query;
      const result = await this.checkinService.getUserManagedCheckins(createdByUserId, Number(page), Number(limit));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public createCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const imageFile = req.file;
      if (!imageFile) {
        throw new HttpException(400, 'Image file is missing');
      }

      const checkinData: CreateCheckinDto = req.body;
      const newCheckin = await this.checkinService.createCheckin(accountId, checkinData, imageFile);
      res.status(201).json({ data: newCheckin, message: 'Check-in created successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getCheckinById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkinId = req.params.id as string;
      const checkin = await this.checkinService.getCheckinById(checkinId);
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  public getCheckinsBySubject = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      const user = await getUserByAccountId(req.account?.id as string);
      const createdByUserId = user?.id;
      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }

      const subjectId = req.params.subjectId as string;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.checkinService.getCheckinsBySubject(subjectId, Number(page), Number(limit), user.id, role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public updateCheckin = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      if (!accountId) throw new HttpException(401, 'Unauthorized');

      const checkinId = req.params.id as string;
      const updateData: UpdateCheckinDto = req.body;

      const updatedCheckin = await this.checkinService.updateCheckinNotes(accountId, checkinId, updateData);
      res.status(200).json({ data: updatedCheckin, message: 'Check-in updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getUserManagedCheckinsByTime = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || role !== 'USER') throw new HttpException(403, 'Forbidden: This route is for users only');

      const user = await getUserByAccountId(accountId);
      if (!user?.id) throw new HttpException(401, 'Unauthorized: User record missing');

      // BỔ SUNG: Đọc thêm startTime và endTime trực tiếp từ query
      const { startDate, endDate, startTime, endTime, page = 1, limit = 10 } = req.query;

      // Kiểm tra thủ công các tham số ngày bắt buộc
      if (!startDate || !endDate) {
        throw new HttpException(400, 'Missing required query parameters: startDate and endDate');
      }

      // Chuẩn hóa giá trị giờ phút giây, nếu không truyền thì mặc định bao quát cả ngày
      const finalStartTime = startTime ? String(startTime) : '00:00:00';
      const finalEndTime = endTime ? String(endTime) : '23:59:59';

      console.log(`[DEBUG - FILTER ALL] User ID: ${user.id} lọc dữ liệu từ [${startDate} ${finalStartTime}] đến [${endDate} ${finalEndTime}]`);

      // Truyền thêm dữ liệu thời gian chi tiết xuống tầng Service xử lý nghiệp vụ
      const result = await this.checkinService.getUserManagedCheckinsAndTime(
        user.id,
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

  /**
   * Endpoint độc lập lọc thời gian cho một đối tượng cụ thể
   * GET /api/v1/checkins/subject/:subjectId/time-filter?startDate=...&endDate=...&startTime=...&endTime=...
   */
  public getCheckinsBySubjectAndTime = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      const user = await getUserByAccountId(accountId);
      if (!user?.id) throw new HttpException(401, 'Unauthorized: Manager account not found');

      const subjectId = req.params.subjectId as string;

      // BỔ SUNG: Đọc thêm startTime và endTime trực tiếp từ query
      const { startDate, endDate, startTime, endTime, page = 1, limit = 10 } = req.query;

      // Kiểm tra thủ công các tham số ngày bắt buộc
      if (!startDate || !endDate) {
        throw new HttpException(400, 'Missing required query parameters: startDate and endDate');
      }

      // Chuẩn hóa giá trị giờ phút giây, nếu không truyền thì mặc định bao quát cả ngày
      const finalStartTime = startTime ? String(startTime) : '00:00:00';
      const finalEndTime = endTime ? String(endTime) : '23:59:59';

      console.log(`[DEBUG - FILTER SINGLE] Subject ID: ${subjectId} lọc từ [${startDate} ${finalStartTime}] đến [${endDate} ${finalEndTime}] bởi User: ${user.id}`);

      // Truyền thêm dữ liệu thời gian chi tiết xuống tầng Service xử lý nghiệp vụ
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

  public exportReport = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role?.toUpperCase();
      if (!accountId || !role) throw new HttpException(401, 'Unauthorized');

      const user = await getUserByAccountId(accountId);
      if (!user?.id) throw new HttpException(401, 'Unauthorized');

      const { startDate, endDate, subjectId } = req.query as any;

      const buffer = await this.checkinService.exportCheckinReportExcel(user.id, role, { startDate, endDate, subjectId });

      // Thiết lập Header báo hiệu cho trình duyệt tải file nhị phân
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Bao-Cao-Checkin-${Date.now()}.xlsx`);

      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  };
}