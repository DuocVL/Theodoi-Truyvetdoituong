import { NextFunction, Request, Response } from 'express';
import trackingService from '../services/tracking.service';

class TrackingController {
  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allLogs = await trackingService.getAllTrackingLogs();
      res.status(200).json({ data: allLogs, message: 'Fetched all tracking logs' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const checkin = await trackingService.getCheckinById(id);
      if (!checkin) {
        res.status(404).json({ message: 'Không tìm thấy dữ liệu check-in này.' });
        return;
      }
      res.status(200).json({ data: checkin });
    } catch (error) {
      next(error);
    }
  };

  public getCheckinHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { subjectId } = req.params;
    const { from, to } = req.query;

    try {
      const fromDate = from ? new Date(String(from)) : undefined;
      const toDate = to ? new Date(String(to)) : undefined;

      if (fromDate && toDate && fromDate > toDate) {
        res.status(400).json({ message: 'Invalid query parameters: from must be before or equal to to' });
        return;
      }

      const history = await trackingService.getCheckinHistory(subjectId, fromDate, toDate);
      res.json(history);
    } catch (error) {
      next(error);
    }
  };

  public getLastLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { subjectId } = req.params;

    try {
      const lastLocation = await trackingService.getLastLocation(subjectId);
      if (!lastLocation) {
        res.status(404).json({ message: 'No location found for this subject' });
        return;
      }

      res.json(lastLocation);
    } catch (error) {
      next(error);
    }
  };
}

export default new TrackingController();
