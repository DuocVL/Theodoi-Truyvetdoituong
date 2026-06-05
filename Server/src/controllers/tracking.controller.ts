
import { NextFunction, Request, Response } from 'express';
import trackingService from '../services/tracking.service';

class TrackingController {
  // New method to handle getting all logs
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allLogs = await trackingService.getAllTrackingLogs();
      res.status(200).json({ data: allLogs, message: 'Fetched all tracking logs' });
    } catch (error) {
      next(error);
    }
  }

  public getCheckinHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { subjectId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: 'Missing required query parameters: from, to' });
      return;
    }

    try {
      // Đảm bảo from và to là string đơn lẻ
      const history = await trackingService.getCheckinHistory(
        subjectId,
        new Date(String(from)),
        new Date(String(to))
      );
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

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
  }
}

export default new TrackingController();
