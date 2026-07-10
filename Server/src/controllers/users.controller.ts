import { NextFunction, Request, Response } from 'express';
import userService from '../services/users.service';
import { updateUserSchema } from '../dtos/users.dto';
import { z } from 'zod';
import { HttpException } from '../exceptions/http-exception';
import { getUserByAccountId } from '../repositories/user.repository';

//xử lý các yêu cầu liên quan đến user

class UserController {

  //lấy danh sách các user
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra quyền
      if(req.role !== "ADMIN"){
        res.status(403).json({ message: "Forbidden"});
        return;
      }

      // Trích xuất cả fullName và role(nếu có)
      const fullName = req.query.fullName as string;
      const role = req.query.role as string;

      //lấy danh sách
      const users = await userService.findAllUsers(fullName, role);
      res.status(200).json({ data: users, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  //lấy thông tin user theo id
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra thông tin xác thực
      const role = req.role;
      const accountId = req.account?.id;
      if(!accountId || !role) throw new HttpException(401,"Error author");

      //tìm kiếm user
      const userId = z.string().parse(req.params.id);
      const user = await userService.findUserById(userId);

      //kiểm tra quyền cán bộ chỉ xem được chính mình
      if(role === "USER"){
        const userRequest = await getUserByAccountId(accountId);
        if(!userRequest || userRequest.id !== userId) throw new HttpException(403,"Forbidden");
      }
      res.status(200).json({ data: user, message: 'findOne' });
    } catch (error) {
      next(error);
    }
  };

  //cập nhật thông tin user
  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra thông tin xác thực
      const role = req.role;
      const accountId = req.account?.id;
      if(!accountId || !role) throw new HttpException(401,"Error author");

      //admin có quyền cập nhật
      if(role !== "ADMIN") throw new HttpException(403,"Forbidden");

      //lấy thông tin user
      const userId = z.string().parse(req.params.id);
      const userData = updateUserSchema.parse(req.body);
      //cập nhật
      const updatedUser = await userService.updateUser(userId, userData);
      res.status(200).json({ data: updatedUser, message: 'update' });
    } catch (error) {
      next(error);
    }
  };

  //xóa user
  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //kiểm tra thông tin xác thực
      const role = req.role;
      const accountId = req.account?.id;
      if(!accountId || !role) throw new HttpException(401,"Error author");
      //admin có quyền xóa
      if(role !== "ADMIN") throw new HttpException(403,"Forbidden");

      //xóa user
      const userId = z.string().parse(req.params.id);
      await userService.deleteUser(userId);
      res.status(200).json({ message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
