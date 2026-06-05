
import { NextFunction, Request, Response } from 'express';
import ZoneService from '../services/zones.service';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';
import { RequestWithUser } from '../types/data';

class ZoneController {
  // ZoneService đã là một instance được export default
  private zoneService = ZoneService;

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneData = createZoneSchema.parse(req.body);
      const createdByUserId = req.account?.id as string;
      const newZone = await this.zoneService.createZone(zoneData, createdByUserId);
      res.status(201).json({ data: newZone, message: 'Zone created successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      // RequestWithUser sử dụng 'account' thay vì 'user'
      const userId = req.account?.id;
      
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found' });
        return;
      }

      const zones = await this.zoneService.findAllZones(userId);
      res.status(200).json({ data: zones });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      const zone = await this.zoneService.findZoneById(zoneId as string);
      res.status(200).json({ data: zone });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      const zoneData = updateZoneSchema.parse(req.body);
      const updatedZone = await this.zoneService.updateZone(zoneId as string, zoneData);
      res.status(200).json({ data: updatedZone, message: 'Zone updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      await this.zoneService.deleteZone(zoneId as string);
      res.status(200).json({ message: 'Zone deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export default ZoneController;
