
import { NextFunction, Request, Response } from 'express';
import userService from '../services/users.service';
import { updateUserSchema } from '../dtos/users.dto';
import { z } from 'zod';

class UserController {

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userService.findAllUsers();
      res.status(200).json({ data: users, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = z.string().parse(req.params.id);
      const user = await userService.findUserById(userId);
      res.status(200).json({ data: user, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = z.string().parse(req.params.id);
      const userData = updateUserSchema.parse(req.body);
      const updatedUser = await userService.updateUser(userId, userData);
      res.status(200).json({ data: updatedUser, message: 'update' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = z.string().parse(req.params.id);
      await userService.deleteUser(userId);
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
