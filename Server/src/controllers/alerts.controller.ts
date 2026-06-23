import { Request, Response, NextFunction } from 'express';
import * as alertService from '../services/alerts.service';
import { getUserByAccountId } from '../repositories/user.repository'
import { getSubjectByAccountId } from '../repositories/subject.repository'

export const getAlertsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;

        // Trích xuất các tham số lọc từ query string
        const filters = {
            type: req.query.type as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        };

        const role = req.role
        if (!role) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const accountId = req.account?.id as string
        let userId
        let subjectId

        if (role === "USER" || role === "ADMIN") {
            const user = await getUserByAccountId(accountId);
            userId = user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: Account ID not found' });
                return;
            }
        } else {
            const subject = await getSubjectByAccountId(accountId);
            subjectId = subject?.id;
            if (!subjectId) {
                res.status(401).json({ message: 'Unauthorized: Account ID not found' });
                return;
            }
        }


        // Giả sử req.user đã được gán bởi AuthMiddleware
        const result = await alertService.findAllAlerts(role, page, limit,filters, userId, subjectId);

        res.status(200).json({
            data: result.alerts,
            pagination: { current: page, total: result.total, limit,totalPages: Math.ceil(result.total / limit) }
        });
    } catch (error) { next(error); }
};

export const getAlertDetailController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertDetail(id as string);
    return res.status(200).json({ success: true, data: alert });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json(alert);
    } catch (error) { next(error); }
};