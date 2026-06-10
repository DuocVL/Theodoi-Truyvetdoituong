import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Subject } from '@prisma/client';
import { SubjectService } from '@services/subjects.service';
import { CreateSubjectDto } from '@dtos/subjects.dto';
import { RequestWithUser } from '@interfaces/auth.interface';

export class SubjectController {
  public subjectService = Container.get(SubjectService);

  public getSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllSubjectsData: Subject[] = await this.subjectService.findAllSubjects();

      res.status(200).json({ data: findAllSubjectsData, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  // FIX: Sửa lại hoàn toàn để gọi đến service, không tự thực hiện logic
  public getSubjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId: string = req.params.id;
      // Gọi đến hàm service đã được bảo mật
      const findOneSubjectData: Partial<Subject> = await this.subjectService.findSubjectById(subjectId);

      res.status(200).json({ data: findOneSubjectData, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public createSubject = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectData: CreateSubjectDto = req.body;
      const createdBy: string = req.user.id;
      const createSubjectData: Subject = await this.subjectService.createSubject(subjectData, createdBy);

      res.status(201).json({ data: createSubjectData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public updateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId: string = req.params.id;
      const subjectData: CreateSubjectDto = req.body;
      const updateSubjectData: Subject = await this.subjectService.updateSubject(subjectId, subjectData);

      res.status(200).json({ data: updateSubjectData, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public deleteSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectId: string = req.params.id;
      const deleteSubjectData: Subject = await this.subjectService.deleteSubject(subjectId);

      res.status(200).json({ data: deleteSubjectData, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
