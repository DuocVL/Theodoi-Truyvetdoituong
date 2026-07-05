// src/controllers/zones.controller.ts
import { NextFunction, Response } from 'express';
import ZoneService from '../services/zones.service';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';
import { getUserByAccountId } from '../repositories/user.repository'
import { RequestWithUser } from '../types/data';

//xử lý các yêu cầu với zone

class ZoneController {
  private zoneService = ZoneService;

  //tạo zone
  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneData = createZoneSchema.parse(req.body);//lấy thông tin

      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      //lấy thông tin cacns bộ yêu cầu
      const user = await getUserByAccountId(req.account?.id as string);
      if(!user){
        res.status(404).json({message: "User not found"});
        return;
      }
      const createdByUserId = user.id;

      //tạo zone
      const newZone = await this.zoneService.createZone(zoneData, createdByUserId, role);
      res.status(201).json({ data: newZone, message: 'Zone created successfully' });
    } catch (error) {
      next(error);
    }
  };

  //lấy danh sách zone của 1 subject cụ thể 
  public getAll = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {

      //xử lý tham số subjectID
      const subjectId = req.query.subjectId as string;
      if (!subjectId) {
        res.status(400).json({ message: 'Missing subjectId query parameter' });
        return;
      }

      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      //lấy thông tin cacns bộ yêu cầu
      const user = await getUserByAccountId(req.account?.id as string);
      if(!user){
        res.status(404).json({message: "User not found"});
        return;
      }
      const createdByUserId = user.id;

      //lấy danh sách
      const zones = await this.zoneService.findZonesBySubject(subjectId, createdByUserId, role);
      res.status(200).json({ data: zones });
    } catch (error) {
      next(error);
    }
  };

  //lấy chi tiết thông tin 1 zone theo id
  public getById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;//lấy id zone

      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      //lấy thông tin cacns bộ yêu cầu
      const user = await getUserByAccountId(req.account?.id as string);
      if(!user){
        res.status(404).json({message: "User not found"});
        return;
      }
      const createdByUserId = user.id;

      //lấy thông tin zone
      const zone = await this.zoneService.findZoneById(zoneId as string, createdByUserId, role);
      res.status(200).json({ data: zone });
    } catch (error) {
      next(error);
    }
  };

  //cập nhật thông tin zone
  public update = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //lấy dữ liệu cần thiết
      const zoneId = req.params.id;
      const zoneData = updateZoneSchema.parse(req.body);

      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      //lấy thông tin cacns bộ yêu cầu
      const user = await getUserByAccountId(req.account?.id as string);
      if(!user){
        res.status(404).json({message: "User not found"});
        return;
      }
      const createdByUserId = user.id;

      //cập nhật
      const updatedZone = await this.zoneService.updateZone(zoneId as string, zoneData, createdByUserId, role);
      res.status(200).json({ data: updatedZone, message: 'Zone updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  //xóa zone
  public delete = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      //lấy zoneId
      const zoneId = req.params.id;

      //kiểm tra quyền
      const role = req.role;
      if (role !== 'ADMIN' && role !== 'USER') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
      //lấy thông tin cacns bộ yêu cầu
      const user = await getUserByAccountId(req.account?.id as string);
      if(!user){
        res.status(404).json({message: "User not found"});
        return;
      }
      const createdByUserId = user.id;

      //xóa zone
      const result = await this.zoneService.deleteZone(zoneId as string, createdByUserId, role);
      res.status(200).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  };
}

export default ZoneController;