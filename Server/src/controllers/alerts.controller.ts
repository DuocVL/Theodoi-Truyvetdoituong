import { Request, Response, NextFunction } from 'express';
import * as alertService from '../services/alerts.service';
import { getUserByAccountId } from '../repositories/user.repository'
import { getSubjectByAccountId } from '../repositories/subject.repository'

export const getAlertsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;

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
        const result = await alertService.findAllAlerts(role, page, limit, userId, subjectId);

        res.status(200).json({
            data: result.alerts,
            pagination: { current: page, total: result.total, limit }
        });
    } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alert = await alertService.createAlert(req.body);
        res.status(201).json(alert);
    } catch (error) { next(error); }
};