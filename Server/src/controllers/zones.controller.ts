// src/controllers/zones.controller.ts
import { NextFunction, Response } from 'express';
import ZoneService from '../services/zones.service';
import { createZoneSchema, updateZoneSchema } from '../dtos/zones.dto';
import { RequestWithUser } from '../types/data';

class ZoneController {
  private zoneService = ZoneService;

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneData = createZoneSchema.parse(req.body);
      const createdByUserId = req.account?.id as string;
      const role = req.account?.role || 'USER';

      const newZone = await this.zoneService.createZone(zoneData, createdByUserId, role);
      res.status(201).json({ data: newZone, message: 'Zone created successfully' });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.account?.id as string;
      const role = req.account?.role || 'USER';
      const subjectId = req.query.subjectId as string;

      if (!subjectId) {
        res.status(400).json({ message: 'Missing subjectId query parameter' });
        return;
      }

      const zones = await this.zoneService.findZonesBySubject(subjectId, userId, role);
      res.status(200).json({ data: zones });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      const userId = req.account?.id as string;
      const role = req.account?.role || 'USER';

      const zone = await this.zoneService.findZoneById(zoneId as string, userId, role);
      res.status(200).json({ data: zone });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      const userId = req.account?.id as string;
      const role = req.account?.role || 'USER';
      const zoneData = updateZoneSchema.parse(req.body);

      const updatedZone = await this.zoneService.updateZone(zoneId as string, zoneData, userId, role);
      res.status(200).json({ data: updatedZone, message: 'Zone updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const zoneId = req.params.id;
      const userId = req.account?.id as string;
      const role = req.account?.role || 'USER';

      const result = await this.zoneService.deleteZone(zoneId as string, userId, role);
      res.status(200).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  };
}

export default ZoneController;