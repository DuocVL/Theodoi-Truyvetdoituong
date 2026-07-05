import { NextFunction, Request, Response } from 'express';
import SubjectService from '../services/subjects.service';
import { RequestWithUser } from '../types/data';
import { activateAccountSchema, createSubjectSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import { getUserByAccountId } from '../repositories/user.repository';
import { z } from 'zod';
import { getSubjectByAccountId } from '../repositories/subject.repository';
import { HttpException } from '../exceptions/http-exception';

//xử lý các tác vụ liên quan đến subject

class SubjectController {
  private subjectService = new SubjectService();

  //tạo subject dành cho admin//user
  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') res.status(403).json({ message: 'Forbidden' });
      
      const subjectData = createSubjectSchema.parse(req.body);//lấy dữ liệu hồ sơ

      //lấy thông tin cán bộ tạo hồ sơ
      const user = await getUserByAccountId(req.account?.id as string);
      const createdByUserId = user?.id;

      if (!createdByUserId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }
      //tạo hồ sơ
      const result = await this.subjectService.createSubjectAndInvite(subjectData, createdByUserId);
      res.status(201).json({ message: 'Hồ sơ đối tượng đã được tạo. Email mời kích hoạt đã được gửi.', data: result.subject });
    } catch (error) {
      next(error);
    }
  };

  //active tài khoản đối tượng
  public activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //lấy thông tin active có token , username , password
      const activationData = activateAccountSchema.parse(req.body);
      //thực hiện active tài khoản
      await this.subjectService.activateAccount(activationData);
      res.status(200).json({ message: 'Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.' });
    } catch (error) {
      next(error);
    }
  };

  //lấy danh sách các đối tượng
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      //lấy thông tin user yêu cầu
      const user = await getUserByAccountId(req.account?.id as string)
      if(!user){
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }
      const subjects = await this.subjectService.findAllSubjects(role, user.id);
      res.status(200).json({ data: subjects, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  //lấy thông tin chi tiết 1 đối tượng
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //lấy các thông tin tài khoản
      const accountId = req.account?.id;
      const role = req.account?.id
      if(!accountId || !role) throw new HttpException(401,"Error author");

      const subjectId = z.string().parse(req.params.id);//lấy id đối tượng
      const subject = await this.subjectService.findSubjectById(subjectId, accountId, role);
      res.status(200).json({ data: subject, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  //cập nhật thông tin của đối tượng
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role;
      if(!accountId || !role) throw new HttpException(401,"Error author");

      //lấy thông tin subject
      const subjectId = z.string().parse(req.params.id);
      const subjectData = updateSubjectSchema.parse(req.body);

      //cập nhật thông tin
      const updatedSubject = await this.subjectService.updateSubject(subjectId, subjectData, accountId, role);
      res.status(200).json({ data: updatedSubject, message: 'update' });
    } catch (error) {
      next(error);
    }
  };

  //xóa đối tượng
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accountId = req.account?.id;
      const role = req.role;
      if(!accountId || !role) throw new HttpException(401,"Error author");

      const subjectId = z.string().parse(req.params.id);//lấy subjectid
      await this.subjectService.deleteSubject(subjectId, accountId, role);//xóa
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };

  //cập nhật FCM token
  public updateFCMToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra quyền chỉ subject cập nhật
      const accountId = req.account?.id;
      const role = req.role;
      if(!accountId || !role) throw new HttpException(401,"Error author");
      if (role !== 'SUBJECT') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      //lấy fcm-token và kiểm tra
      const fcm_token = req.body.fcm_token
      if(!fcm_token){
        res.status(400).json({messager: "Dữ liệu không hợp lệ"})
        return;
      }

      //cập nhật token
      await this.subjectService.updateToken(accountId, fcm_token);
      res.status(200).json({ message: 'updated' });
    } catch (error) {
      next(error);
    }
  }
}

export default SubjectController;
