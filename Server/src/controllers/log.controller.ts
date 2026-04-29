import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/log.service';

export async function getRequestLogs(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const data = await logService.getRequestLogs(page, limit);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

export async function getAuthLogs(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const accountId = req.query.accountId as string | undefined;
        const data = await logService.getAuthLogs(page, limit, accountId);
        res.json(data);
    } catch (error) {
        next(error);
    }
}

export async function getSystemLogs(req: Request, res: Response, next: NextFunction) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const userId = req.query.userId as string | undefined;
        const entity = req.query.entity as string | undefined;
        const data = await logService.getSystemLogs(page, limit, userId, entity);
        res.json(data);
    } catch (error) {
        next(error);
    }
}
