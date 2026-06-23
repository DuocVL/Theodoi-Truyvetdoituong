import { NextFunction, Request, Response } from 'express';
import SubjectService from '../services/subjects.service';
import { RequestWithUser } from '../types/data';
import { activateAccountSchema, createSubjectSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import { getUserByAccountId } from '../repositories/user.repository';
import { z } from 'zod';
import { getSubjectByAccountId } from '../repositories/subject.repository';

class SubjectController {
  private subjectService = new SubjectService();

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      const subjectData = createSubjectSchema.parse(req.body);
      const user = await getUserByAccountId(req.account?.id as string);
      const createdByUserId = user?.id;
      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }
      const result = await this.subjectService.createSubjectAndInvite(subjectData, createdByUserId);
      res.status(201).json({ message: 'Hồ sơ đối tượng đã được tạo. Email mời kích hoạt đã được gửi.', data: result.subject });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activationData = activateAccountSchema.parse(req.body);
      await this.subjectService.activateAccount(activationData);
      res.status(200).json({ message: 'Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.' });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjects = await this.subjectService.findAllSubjects();
      res.status(200).json({ data: subjects, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId = z.string().parse(req.params.id);
      const subject = await this.subjectService.findSubjectById(subjectId);
      res.status(200).json({ data: subject, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'USER' ) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      const subjectId = z.string().parse(req.params.id);
      const subjectData = updateSubjectSchema.parse(req.body);
      const updatedSubject = await this.subjectService.updateSubject(subjectId, subjectData);
      res.status(200).json({ data: updatedSubject, message: 'update' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.role?.toUpperCase();
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      const subjectId = z.string().parse(req.params.id);
      await this.subjectService.deleteSubject(subjectId);
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  public updateFCMToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.role?.toUpperCase();
      if (role !== 'SUBJECT') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      const fcm_token = req.body.fcm_token
      if(!fcm_token){
        res.status(400).json({messager: "Dữ liệu không hợp lệ"})
        return;
      }

      const subject = await getSubjectByAccountId(req.account?.id as string)
      if(!subject){
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }

      await this.subjectService.updateToken(subject?.id, fcm_token);
      res.status(200).json({ message: 'updated' });
    } catch (error) {
      next(error);
    }
  }
}

export default SubjectController;
