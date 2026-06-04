import { NextFunction, Request, Response } from 'express';
import SubjectService from '../services/subjects.service';
import { RequestWithUser } from '../types/data';
import { createSubjectSchema, activateAccountSchema, updateSubjectSchema } from '../dtos/subjects.dto';
import { z } from 'zod';

class SubjectController {
  private subjectService = new SubjectService();

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = (req as any).role;
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const subjectData = createSubjectSchema.parse(req.body);
      const createdByUserId = req.user.id;
      const result = await this.subjectService.createSubjectAndInvite(subjectData, createdByUserId);
      res.status(201).json({ message: 'Subject created and invitation sent successfully.', data: result.subject });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activationData = activateAccountSchema.parse(req.body);
      await this.subjectService.activateAccount(activationData);
      res.status(200).json({ message: 'Account activated successfully. You can now log in.' });
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
      const role = (req as any).role;
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
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
      const role = (req as any).role;
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const subjectId = z.string().parse(req.params.id);
      await this.subjectService.deleteSubject(subjectId);
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export default SubjectController;
