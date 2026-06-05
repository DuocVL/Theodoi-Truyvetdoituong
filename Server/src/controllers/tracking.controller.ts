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

  public getCheckinHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { subjectId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ message: 'Missing required query parameters: from, to' });
      return;
    }

    try {
      const fromDate = new Date(String(from));
      const toDate = new Date(String(to));

      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        res.status(400).json({ message: 'Invalid query parameters: from, to must be valid dates' });
        return;
      }

      if (fromDate > toDate) {
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
