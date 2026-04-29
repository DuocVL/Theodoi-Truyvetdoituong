
import { NextFunction, Request, Response } from 'express';
import SubjectService from '../services/subjects.service';
import { RequestWithUser } from '../types/data';
import { createSubjectSchema, activateAccountSchema } from '../dtos/subjects.dto';

class SubjectController {
  private subjectService = new SubjectService();

  // This should be a protected route, only for Users (e.g. case officers)
  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjectData = createSubjectSchema.parse(req.body);
      const createdByUserId = req.user.id; // Assumes auth middleware provides user

      const result = await this.subjectService.createSubjectAndInvite(subjectData, createdByUserId);

      res.status(201).json({ 
        message: 'Subject created and invitation sent successfully.',
        subjectId: result.subject.id 
      });
    } catch (error) {
      next(error);
    }
  };

  // This is a public route
  public activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const activationData = activateAccountSchema.parse(req.body);
      await this.subjectService.activateAccount(activationData);

      res.status(200).json({ message: 'Account activated successfully. You can now log in.' });
    } catch (error) {
      next(error);
    }
  };
  
  // ... other methods for getting/listing/updating subjects can be added here
}

export default SubjectController;
