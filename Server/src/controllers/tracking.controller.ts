
import { Request, Response } from 'express';
import trackingService from '../services/tracking.service';

class TrackingController {
  async getCheckinHistory(req: Request, res: Response) {
    const { subjectId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'Missing required query parameters: from, to' });
    }

    try {
      const history = await trackingService.getCheckinHistory(
        subjectId,
        new Date(from as string),
        new Date(to as string)
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching check-in history', error });
    }
  }

  async getLastLocation(req: Request, res: Response) {
    const { subjectId } = req.params;
    try {
      const lastLocation = await trackingService.getLastLocation(subjectId);
      if (!lastLocation) {
        return res.status(404).json({ message: 'No location found for this subject' });
      }
      res.json(lastLocation);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching last location', error });
    }
  }
}

export default new TrackingController();
